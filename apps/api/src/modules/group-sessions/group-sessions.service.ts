import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GroupSessionStatus,
  ItemServiceKind,
  PeopleType,
} from '@gym-monorepo/shared';
import { GroupSessionEntity } from '../../database/entities/group-session.entity';
import { GroupSessionParticipantEntity } from '../../database/entities/group-session-participant.entity';
import { CreateGroupSessionDto } from './dto/create-group-session.dto';
import { UpdateGroupSessionDto } from './dto/update-group-session.dto';
import { GroupSessionQueryDto } from './dto/group-session-query.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import {
  PaginatedResponse,
  calculateSkip,
  paginate,
} from '../../common/dto/pagination.dto';
import { MembersService } from '../members/members.service';
import { ItemsService } from '../catalog/items/items.service';
import { PeopleService } from '../people/people.service';
import { calculateMembershipEndDate } from '../memberships/utils/membership-dates.util';

@Injectable()
export class GroupSessionsService {
  constructor(
    @InjectRepository(GroupSessionEntity)
    private readonly groupSessionRepository: Repository<GroupSessionEntity>,
    @InjectRepository(GroupSessionParticipantEntity)
    private readonly participantRepository: Repository<GroupSessionParticipantEntity>,
    private readonly membersService: MembersService,
    private readonly itemsService: ItemsService,
    private readonly peopleService: PeopleService,
  ) {}

  async findAll(
    tenantId: string,
    query: GroupSessionQueryDto,
  ): Promise<PaginatedResponse<GroupSessionEntity>> {
    const { page = '1', limit = '10', memberId, instructorId, status } = query;
    const skip = calculateSkip(parseInt(page), parseInt(limit));

    const qb = this.groupSessionRepository.createQueryBuilder('groupSession');
    qb.leftJoinAndSelect('groupSession.purchaserMember', 'purchaserMember')
      .leftJoinAndSelect('purchaserMember.person', 'purchaserPerson')
      .leftJoinAndSelect('groupSession.instructor', 'instructor')
      .leftJoinAndSelect('groupSession.participants', 'participants')
      .leftJoinAndSelect('participants.member', 'participantMember')
      .leftJoinAndSelect('participantMember.person', 'participantPerson')
      .where('groupSession.tenantId = :tenantId', { tenantId });

    if (memberId) {
      qb.andWhere(
        '(groupSession.purchaserMemberId = :memberId OR participants.memberId = :memberId)',
        { memberId },
      );
    }

    if (instructorId) {
      qb.andWhere('groupSession.instructorId = :instructorId', {
        instructorId,
      });
    }

    if (status) {
      qb.andWhere('groupSession.status = :status', { status });
    }

    qb.orderBy('groupSession.createdAt', 'DESC')
      .skip(skip)
      .take(parseInt(limit));

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, parseInt(page), parseInt(limit));
  }

  async findOne(tenantId: string, id: string): Promise<GroupSessionEntity> {
    const groupSession = await this.groupSessionRepository.findOne({
      where: { id, tenantId },
      relations: {
        purchaserMember: { person: true },
        instructor: true,
        item: true,
        participants: { member: { person: true } },
      },
    });

    if (!groupSession) {
      throw new NotFoundException('Group Session not found');
    }

    return groupSession;
  }

  async create(
    tenantId: string,
    dto: CreateGroupSessionDto,
  ): Promise<GroupSessionEntity> {
    // Validate purchaser member
    await this.membersService.findOne(tenantId, dto.purchaserMemberId);

    // Validate item
    const item = await this.itemsService.findOne(dto.itemId, tenantId);
    if (item.serviceKind !== ItemServiceKind.PT_SESSION) {
      throw new BadRequestException('Item must be a PT Session');
    }
    if (item.maxParticipants <= 1 && !dto.totalSessions) {
      // Technically C6F is for group sessions (max > 1)
      // if user manually creates a group session for a single person item, they should probably use pt-packages
    }

    // Validate instructor if provided
    if (dto.instructorId) {
      const instructor = await this.peopleService.findOne(
        tenantId,
        dto.instructorId,
      );
      if (instructor.type !== PeopleType.STAFF) {
        throw new BadRequestException('Instructor must be staff');
      }
    }

    const expiryDate =
      item.durationValue && item.durationUnit
        ? calculateMembershipEndDate(
            dto.startDate,
            item.durationValue,
            item.durationUnit,
          )
        : null;

    const totalSessions = dto.totalSessions ?? item.sessionCount ?? 0;

    const groupSession = this.groupSessionRepository.create({
      tenantId,
      purchaserMemberId: dto.purchaserMemberId,
      itemId: dto.itemId,
      itemName: item.name,
      startDate: dto.startDate,
      expiryDate,
      totalSessions,
      remainingSessions: totalSessions,
      usedSessions: 0,
      pricePaid: dto.pricePaid,
      instructorId: dto.instructorId,
      notes: dto.notes,
      maxParticipants: item.maxParticipants,
      status: GroupSessionStatus.ACTIVE,
    });

    return this.groupSessionRepository.save(groupSession);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateGroupSessionDto,
  ): Promise<GroupSessionEntity> {
    const groupSession = await this.findOne(tenantId, id);

    if (dto.instructorId !== undefined) {
      if (dto.instructorId) {
        const instructor = await this.peopleService.findOne(
          tenantId,
          dto.instructorId,
        );
        if (instructor.type !== PeopleType.STAFF) {
          throw new BadRequestException('Instructor must be staff');
        }
        groupSession.instructorId = dto.instructorId;
      } else {
        groupSession.instructorId = null;
      }
    }

    if (dto.notes !== undefined) {
      groupSession.notes = dto.notes;
    }

    return this.groupSessionRepository.save(groupSession);
  }

  async cancel(tenantId: string, id: string): Promise<GroupSessionEntity> {
    const groupSession = await this.findOne(tenantId, id);

    if (groupSession.status === GroupSessionStatus.CANCELLED) {
      return groupSession;
    }

    groupSession.status = GroupSessionStatus.CANCELLED;

    return this.groupSessionRepository.save(groupSession);
  }

  async addParticipant(
    tenantId: string,
    sessionId: string,
    dto: AddParticipantDto,
  ): Promise<GroupSessionParticipantEntity> {
    const session = await this.findOne(tenantId, sessionId);

    if (session.participants.length >= session.maxParticipants) {
      throw new BadRequestException('Group Session is full');
    }

    const existing = session.participants.find(
      (p) => p.memberId === dto.memberId,
    );
    if (existing) {
      if (existing.isActive) return existing;
      existing.isActive = true;
      return this.participantRepository.save(existing);
    }

    // Validate member exists
    await this.membersService.findOne(tenantId, dto.memberId);

    const participant = this.participantRepository.create({
      groupSessionId: sessionId,
      memberId: dto.memberId,
      isActive: true,
    });

    return this.participantRepository.save(participant);
  }

  async removeParticipant(
    tenantId: string,
    sessionId: string,
    memberId: string,
  ): Promise<void> {
    const session = await this.findOne(tenantId, sessionId);
    const participant = session.participants.find(
      (p) => p.memberId === memberId && p.isActive,
    );

    if (!participant) {
      throw new NotFoundException('Participant not found or already inactive');
    }

    participant.isActive = false;
    await this.participantRepository.save(participant);
  }

  async getParticipants(
    tenantId: string,
    sessionId: string,
  ): Promise<GroupSessionParticipantEntity[]> {
    const session = await this.findOne(tenantId, sessionId);
    return session.participants;
  }
}
