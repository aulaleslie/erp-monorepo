import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from '../../database/entities';
import { ERROR_CODES, MemberStatus, PeopleType } from '@gym-monorepo/shared';
import {
  PaginatedResponse,
  calculateSkip,
  paginate,
} from '../../common/dto/pagination.dto';
import { TenantCountersService } from '../tenant-counters/tenant-counters.service';
import { PeopleService } from '../people/people.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberQueryDto } from './dto/member-query.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    private readonly peopleService: PeopleService,
    private readonly tenantCountersService: TenantCountersService,
  ) {}

  async findAll(
    tenantId: string,
    query: MemberQueryDto,
  ): Promise<PaginatedResponse<MemberEntity>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status;
    const search = query.search?.trim();

    const qb = this.memberRepository.createQueryBuilder('member');
    qb.leftJoinAndSelect('member.person', 'person');
    qb.where('member.tenantId = :tenantId', { tenantId });

    if (status) {
      qb.andWhere('member.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(member.memberCode ILIKE :search OR person.fullName ILIKE :search OR person.email ILIKE :search OR person.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('member.createdAt', 'DESC')
      .skip(calculateSkip(page, limit))
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, page, limit);
  }

  async lookup(tenantId: string, query: string): Promise<MemberEntity[]> {
    const qb = this.memberRepository.createQueryBuilder('member');
    qb.leftJoinAndSelect('member.person', 'person');
    qb.where('member.tenantId = :tenantId', { tenantId });
    qb.andWhere(
      '(member.memberCode = :exactMatch OR person.phone = :exactMatch OR person.fullName ILIKE :partialMatch OR person.email ILIKE :partialMatch)',
      {
        exactMatch: query,
        partialMatch: `%${query}%`,
      },
    );
    qb.take(5);
    return qb.getMany();
  }

  async findOne(tenantId: string, id: string): Promise<MemberEntity> {
    const member = await this.memberRepository.findOne({
      where: { id, tenantId },
      relations: { person: true },
    });

    if (!member) {
      throw new NotFoundException(ERROR_CODES.MEMBER.NOT_FOUND.message);
    }

    return member;
  }

  async create(tenantId: string, dto: CreateMemberDto): Promise<MemberEntity> {
    let personId = dto.personId;

    if (!personId) {
      // Create new person from nested person object
      if (!dto.person?.fullName) {
        throw new BadRequestException(
          'Person details (person.fullName) are required if personId is not provided',
        );
      }

      const person = await this.peopleService.create(tenantId, {
        fullName: dto.person.fullName,
        email: dto.person.email,
        phone: dto.person.phone,
        type: PeopleType.CUSTOMER,
      });
      personId = person.id;
    } else {
      // Validate existing person
      const person = await this.peopleService.findOne(tenantId, personId);
      if (person.type !== PeopleType.CUSTOMER) {
        throw new BadRequestException(
          ERROR_CODES.MEMBER.PERSON_NOT_CUSTOMER.message,
        );
      }
    }

    // Check if member already exists for this person in this tenant
    const existing = await this.memberRepository.findOne({
      where: { tenantId, personId },
    });

    if (existing) {
      throw new ConflictException(ERROR_CODES.MEMBER.ALREADY_EXISTS.message);
    }

    const memberCode =
      await this.tenantCountersService.getNextMemberCode(tenantId);

    const agreedToTerms = dto.agreedToTerms ?? false;

    const member = this.memberRepository.create({
      tenantId,
      personId,
      memberCode,
      status: MemberStatus.NEW,
      agreesToTerms: agreedToTerms,
      termsAgreedAt: agreedToTerms ? new Date() : null,
      notes: dto.notes,
      profileCompletionPercent: this.calculateProfileCompletion(agreedToTerms),
    });

    const saved = await this.memberRepository.save(member);
    return this.findOne(tenantId, saved.id);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateMemberDto,
  ): Promise<MemberEntity> {
    const member = await this.findOne(tenantId, id);

    if (dto.status !== undefined && dto.status === MemberStatus.ACTIVE) {
      if (member.status !== MemberStatus.ACTIVE) {
        // transitioning to ACTIVE
        // Use current member state merged with updates to validate
        const agreesToTermsValue = dto.agreedToTerms ?? member.agreesToTerms;
        this.validateProfileCompletion({ agreesToTerms: agreesToTermsValue });
      }
    }

    if (dto.status !== undefined) {
      member.status = dto.status;
      if (dto.status === MemberStatus.ACTIVE && !member.memberSince) {
        member.memberSince = new Date();
      }
    }

    if (dto.agreedToTerms !== undefined) {
      member.agreesToTerms = dto.agreedToTerms;
      member.termsAgreedAt = dto.agreedToTerms ? new Date() : null;
      member.profileCompletionPercent = this.calculateProfileCompletion(
        dto.agreedToTerms,
      );
    }

    if (dto.notes !== undefined) {
      member.notes = dto.notes;
    }

    return this.memberRepository.save(member);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const member = await this.findOne(tenantId, id);
    member.status = MemberStatus.INACTIVE;
    await this.memberRepository.save(member);
  }

  private calculateProfileCompletion(agreesToTerms: boolean): number {
    let completed = 0;
    const total = 1; // Currently only agreesToTerms is required

    if (agreesToTerms) {
      completed++;
    }

    return Math.round((completed / total) * 100);
  }

  private validateProfileCompletion(member: Partial<MemberEntity>): void {
    const missingFields: string[] = [];

    if (!member.agreesToTerms) {
      missingFields.push('agreesToTerms');
    }

    if (missingFields.length > 0) {
      throw new BadRequestException({
        ...ERROR_CODES.MEMBER.PROFILE_INCOMPLETE,
        details: { missingFields },
      });
    }

    // Double check percent
    const percent = this.calculateProfileCompletion(!!member.agreesToTerms);
    if (percent < 100) {
      throw new BadRequestException(ERROR_CODES.MEMBER.PROFILE_INCOMPLETE);
    }
  }

  /**
   * Computes and updates the member's current expiry date based on active memberships.
   *
   * @todo Implement full logic when Memberships module (C6B) is available.
   * Current implementation assumes no active memberships (always null).
   */
  async computeMemberExpiry(tenantId: string, id: string): Promise<void> {
    const member = await this.findOne(tenantId, id);

    // TODO: Cycle 6B - Query active memberships and find max end_date
    // The query logic is handled in MembershipsService which calls updateCurrentExpiryDate below.
    // This methods exists for compatibility/legacy or self-contained triggers if we move logic here.
    // implementing no-op or default null reset if needed, but for now we leave it as valid placeholder.

    const maxExpiry = null; // Default to null for now

    if (member.currentExpiryDate !== maxExpiry) {
      member.currentExpiryDate = maxExpiry;
      await this.memberRepository.save(member);
    }
  }

  async updateCurrentExpiryDate(
    tenantId: string,
    id: string,
    date: Date | null,
  ): Promise<void> {
    const member = await this.findOne(tenantId, id);
    // Only update if changed
    const currentDate = member.currentExpiryDate
      ? new Date(member.currentExpiryDate).getTime()
      : null;
    const newDate = date ? new Date(date).getTime() : null;

    if (currentDate !== newDate) {
      member.currentExpiryDate = date;

      // If no active memberships, set status to EXPIRED
      if (date === null && member.status === MemberStatus.ACTIVE) {
        member.status = MemberStatus.EXPIRED;
      }

      await this.memberRepository.save(member);
    }
  }
}
