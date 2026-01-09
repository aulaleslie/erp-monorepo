import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeopleEntity } from '../../database/entities';
import { PEOPLE_ERRORS, PeopleStatus, PeopleType } from '@gym-monorepo/shared';
import {
  PaginatedResponse,
  calculateSkip,
  paginate,
} from '../../common/dto/pagination.dto';
import { TenantCountersService } from '../tenant-counters/tenant-counters.service';
import { createValidationBuilder } from '../../common/utils/validation.util';
import { CreatePeopleDto } from './dto/create-people.dto';
import { UpdatePeopleDto } from './dto/update-people.dto';
import { PeopleQueryDto } from './dto/people-query.dto';
import { InvitablePeopleQueryDto } from './dto/invitable-people-query.dto';
import { InvitePeopleDto } from './dto/invite-people.dto';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(PeopleEntity)
    private readonly peopleRepository: Repository<PeopleEntity>,
    private readonly tenantCountersService: TenantCountersService,
  ) {}

  async findAll(
    tenantId: string,
    query: PeopleQueryDto,
  ): Promise<PaginatedResponse<PeopleEntity>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? PeopleStatus.ACTIVE;
    const search = query.search?.trim();

    const qb = this.peopleRepository.createQueryBuilder('people');
    qb.where('people.tenantId = :tenantId', { tenantId });

    if (query.type) {
      qb.andWhere('people.type = :type', { type: query.type });
    }

    if (status) {
      qb.andWhere('people.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(people.code ILIKE :search OR people.fullName ILIKE :search OR people.email ILIKE :search OR people.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('people.createdAt', 'DESC')
      .skip(calculateSkip(page, limit))
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, page, limit);
  }

  async searchInvitablePeople(
    tenantId: string,
    query: InvitablePeopleQueryDto,
  ): Promise<{
    items: Array<{
      id: string;
      type: PeopleType;
      fullName: string;
      email: string | null;
      phone: string | null;
      tags: string[];
    }>;
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const qb = this.peopleRepository.createQueryBuilder('people');
    qb.where('people.tenantId != :tenantId', { tenantId })
      .andWhere('(people.email IS NOT NULL OR people.phone IS NOT NULL)')
      .andWhere('people.status = :status', { status: PeopleStatus.ACTIVE });

    if (query.type) {
      qb.andWhere('people.type = :type', { type: query.type });
    }

    if (search) {
      qb.andWhere(
        '(people.code ILIKE :search OR people.fullName ILIKE :search OR people.email ILIKE :search OR people.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('people.createdAt', 'DESC');

    const matches = await qb.getMany();
    const deduped: PeopleEntity[] = [];
    const seenKeys = new Set<string>();

    for (const person of matches) {
      const key = this.getInvitableKey(person);
      if (!key || seenKeys.has(key)) {
        continue;
      }
      seenKeys.add(key);
      deduped.push(person);
    }

    const total = deduped.length;
    const start = calculateSkip(page, limit);
    const items = deduped.slice(start, start + limit).map((person) => ({
      id: person.id,
      type: person.type,
      fullName: person.fullName,
      email: person.email,
      phone: person.phone,
      tags: person.tags ?? [],
    }));

    return {
      items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async findOne(tenantId: string, id: string): Promise<PeopleEntity> {
    const person = await this.peopleRepository.findOne({
      where: { id, tenantId },
    });

    if (!person) {
      throw new NotFoundException(PEOPLE_ERRORS.NOT_FOUND.message);
    }

    return person;
  }

  async create(tenantId: string, dto: CreatePeopleDto): Promise<PeopleEntity> {
    const type = dto.type ?? PeopleType.CUSTOMER;
    const fullName = dto.fullName.trim();
    const email = this.normalizeEmail(dto.email);
    const phone = this.normalizePhone(dto.phone);

    await this.assertEmailUnique(tenantId, email);
    await this.assertPhoneUnique(tenantId, phone);

    const code = await this.tenantCountersService.getNextPeopleCode(
      tenantId,
      type,
    );

    const person = this.peopleRepository.create({
      tenantId,
      type,
      code,
      fullName,
      email,
      phone,
      status: PeopleStatus.ACTIVE,
      tags: dto.tags ?? [],
      departmentId:
        type === PeopleType.STAFF ? (dto.departmentId ?? null) : null,
    });

    return this.peopleRepository.save(person);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePeopleDto,
  ): Promise<PeopleEntity> {
    const person = await this.findOne(tenantId, id);

    if (dto.fullName !== undefined) {
      person.fullName = dto.fullName.trim();
    }

    if (dto.email !== undefined) {
      const email = this.normalizeEmail(dto.email);
      await this.assertEmailUnique(tenantId, email, person.id);
      person.email = email;
    }

    if (dto.phone !== undefined) {
      const phone = this.normalizePhone(dto.phone);
      await this.assertPhoneUnique(tenantId, phone, person.id);
      person.phone = phone;
    }

    if (dto.status !== undefined) {
      person.status = dto.status;
    }

    if (dto.tags !== undefined) {
      person.tags = dto.tags ?? [];
    }

    if (dto.departmentId !== undefined) {
      person.departmentId =
        person.type === PeopleType.STAFF ? (dto.departmentId ?? null) : null;
    }

    return this.peopleRepository.save(person);
  }

  async inviteExisting(
    tenantId: string,
    dto: InvitePeopleDto,
  ): Promise<PeopleEntity> {
    const person = await this.peopleRepository.findOne({
      where: { id: dto.personId },
    });

    if (!person || person.tenantId === tenantId) {
      throw new NotFoundException(PEOPLE_ERRORS.NOT_FOUND.message);
    }

    await this.assertEmailUnique(tenantId, person.email);
    await this.assertPhoneUnique(tenantId, person.phone);

    const code = await this.tenantCountersService.getNextPeopleCode(
      tenantId,
      person.type,
    );

    const clone = this.peopleRepository.create({
      tenantId,
      type: person.type,
      code,
      fullName: person.fullName,
      email: person.email,
      phone: person.phone,
      status: person.status,
      tags: person.tags ?? [],
      departmentId: null, // Don't copy departmentId across tenants
      userId: null,
    });

    return this.peopleRepository.save(clone);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const person = await this.findOne(tenantId, id);

    if (person.type === PeopleType.STAFF && person.userId) {
      person.userId = null;
    }

    person.status = PeopleStatus.INACTIVE;
    await this.peopleRepository.save(person);
  }

  private getInvitableKey(person: PeopleEntity): string | null {
    const key = person.email ?? person.phone;
    if (!key) {
      return null;
    }

    const trimmed = key.trim();
    return trimmed ? trimmed.toLowerCase() : null;
  }

  private normalizeEmail(value?: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizePhone(value?: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const cleaned = trimmed.replace(/[\s()-]/g, '');

    if (cleaned.startsWith('+')) {
      if (!cleaned.startsWith('+62')) {
        this.throwInvalidPhone();
      }
      const rest = cleaned.slice(3);
      if (!/^\d+$/.test(rest)) {
        this.throwInvalidPhone();
      }
      return `+62${rest}`;
    }

    if (cleaned.startsWith('62')) {
      const rest = cleaned.slice(2);
      if (!/^\d+$/.test(rest)) {
        this.throwInvalidPhone();
      }
      return `+62${rest}`;
    }

    if (cleaned.startsWith('0')) {
      const rest = cleaned.slice(1);
      if (!/^\d+$/.test(rest)) {
        this.throwInvalidPhone();
      }
      return `+62${rest}`;
    }

    this.throwInvalidPhone();
  }

  private throwInvalidPhone(): never {
    const validator = createValidationBuilder();
    validator.addError('phone', PEOPLE_ERRORS.INVALID_PHONE.message);
    validator.throwIfErrors();
    throw new BadRequestException(PEOPLE_ERRORS.INVALID_PHONE.message);
  }

  private async assertEmailUnique(
    tenantId: string,
    email: string | null,
    excludeId?: string,
  ): Promise<void> {
    if (!email) {
      return;
    }

    const existing = await this.peopleRepository.findOne({
      where: { tenantId, email },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(PEOPLE_ERRORS.DUPLICATE_EMAIL.message);
    }
  }

  private async assertPhoneUnique(
    tenantId: string,
    phone: string | null,
    excludeId?: string,
  ): Promise<void> {
    if (!phone) {
      return;
    }

    const existing = await this.peopleRepository.findOne({
      where: { tenantId, phone },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(PEOPLE_ERRORS.DUPLICATE_PHONE.message);
    }
  }
}
