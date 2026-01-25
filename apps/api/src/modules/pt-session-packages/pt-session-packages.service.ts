import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ItemDurationUnit,
  ItemServiceKind,
  PeopleType,
  PtPackageStatus,
} from '@gym-monorepo/shared';
import { PtPackageEntity } from '../../database/entities/pt-package.entity';
import { calculateMembershipEndDate } from '../memberships/utils/membership-dates.util';
import { CreatePtPackageDto } from './dto/create-pt-package.dto';
import { UpdatePtPackageDto } from './dto/update-pt-package.dto';
import { PtPackageQueryDto } from './dto/pt-package-query.dto';
import {
  PaginatedResponse,
  calculateSkip,
  paginate,
} from '../../common/dto/pagination.dto';
import { MembersService } from '../members/members.service';
import { ItemsService } from '../catalog/items/items.service';
import { PeopleService } from '../people/people.service';

@Injectable()
export class PtSessionPackagesService {
  constructor(
    @InjectRepository(PtPackageEntity)
    private readonly ptPackageRepository: Repository<PtPackageEntity>,
    private readonly membersService: MembersService,
    private readonly itemsService: ItemsService,
    private readonly peopleService: PeopleService,
  ) {}

  async findAll(
    tenantId: string,
    query: PtPackageQueryDto,
  ): Promise<PaginatedResponse<PtPackageEntity>> {
    const { page = 1, limit = 10, memberId, trainerId, status } = query;
    const skip = calculateSkip(page, limit);

    const qb = this.ptPackageRepository.createQueryBuilder('ptPackage');
    qb.leftJoinAndSelect('ptPackage.member', 'member')
      .leftJoinAndSelect('member.person', 'person')
      .leftJoinAndSelect('ptPackage.preferredTrainer', 'preferredTrainer')
      .where('ptPackage.tenantId = :tenantId', { tenantId });

    if (memberId) {
      qb.andWhere('ptPackage.memberId = :memberId', { memberId });
    }

    if (trainerId) {
      qb.andWhere('ptPackage.preferredTrainerId = :trainerId', { trainerId });
    }

    if (status) {
      qb.andWhere('ptPackage.status = :status', { status });
    }

    qb.orderBy('ptPackage.createdAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, page, limit);
  }

  async findOne(tenantId: string, id: string): Promise<PtPackageEntity> {
    const ptPackage = await this.ptPackageRepository.findOne({
      where: { id, tenantId },
      relations: {
        member: { person: true },
        preferredTrainer: true,
        item: true,
      },
    });

    if (!ptPackage) {
      throw new NotFoundException('PT Package not found');
    }

    return ptPackage;
  }

  async create(
    tenantId: string,
    dto: CreatePtPackageDto,
  ): Promise<PtPackageEntity> {
    // Validate member
    await this.membersService.findOne(tenantId, dto.memberId);

    // Validate item
    const item = await this.itemsService.findOne(dto.itemId, tenantId);
    if (item.serviceKind !== ItemServiceKind.PT_SESSION) {
      throw new BadRequestException('Item must be a PT Session');
    }

    // Validate preferred trainer if provided
    if (dto.preferredTrainerId) {
      const trainer = await this.peopleService.findOne(
        tenantId,
        dto.preferredTrainerId,
      );
      if (trainer.type !== PeopleType.STAFF) {
        throw new BadRequestException('Preferred trainer must be staff');
      }
    }

    const expiryDate = this.calculateExpiryDate(
      dto.startDate,
      item.durationValue,
      item.durationUnit,
    );

    const totalSessions = item.sessionCount || 0;

    const ptPackage = this.ptPackageRepository.create({
      tenantId,
      memberId: dto.memberId,
      itemId: dto.itemId,
      itemName: item.name,
      startDate: dto.startDate,
      expiryDate,
      totalSessions,
      remainingSessions: totalSessions,
      usedSessions: 0,
      pricePaid: dto.pricePaid,
      preferredTrainerId: dto.preferredTrainerId,
      notes: dto.notes,
      status: PtPackageStatus.ACTIVE,
    });

    return this.ptPackageRepository.save(ptPackage);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePtPackageDto,
  ): Promise<PtPackageEntity> {
    const ptPackage = await this.findOne(tenantId, id);

    if (dto.preferredTrainerId !== undefined) {
      if (dto.preferredTrainerId) {
        const trainer = await this.peopleService.findOne(
          tenantId,
          dto.preferredTrainerId,
        );
        if (trainer.type !== PeopleType.STAFF) {
          throw new BadRequestException('Preferred trainer must be staff');
        }
        ptPackage.preferredTrainerId = dto.preferredTrainerId;
      } else {
        ptPackage.preferredTrainerId = null;
      }
    }

    if (dto.notes !== undefined) {
      ptPackage.notes = dto.notes;
    }

    return this.ptPackageRepository.save(ptPackage);
  }

  async cancel(tenantId: string, id: string): Promise<PtPackageEntity> {
    const ptPackage = await this.findOne(tenantId, id);

    if (ptPackage.status === PtPackageStatus.CANCELLED) {
      return ptPackage;
    }

    ptPackage.status = PtPackageStatus.CANCELLED;

    return this.ptPackageRepository.save(ptPackage);
  }

  /**
   * Calculates the expiry date of a PT session package based on start date and item duration.
   * If no duration is defined, it never expires (returns null).
   *
   * @param startDate The start date of the package
   * @param durationValue The duration value from the item
   * @param durationUnit The duration unit from the item
   * @returns Calculated expiry date or null
   */
  calculateExpiryDate(
    startDate: Date | string,
    durationValue?: number | null,
    durationUnit?: ItemDurationUnit | null,
  ): Date | null {
    if (!durationValue || !durationUnit) {
      return null;
    }

    return calculateMembershipEndDate(startDate, durationValue, durationUnit);
  }
}
