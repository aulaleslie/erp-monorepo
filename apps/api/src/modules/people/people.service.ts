import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PeopleEntity,
  UserEntity,
  TenantUserEntity,
  RoleEntity,
} from '../../database/entities';
import {
  PEOPLE_ERRORS,
  PeopleStatus,
  PeopleType,
  USER_ERRORS,
  ROLE_ERRORS,
} from '@gym-monorepo/shared';
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
import { InvitableUsersQueryDto } from './dto/invitable-users-query.dto';
import { LinkUserDto } from './dto/link-user.dto';
import { CreateUserForStaffDto } from './dto/create-user-for-staff.dto';
import { hashPassword } from '../../common/utils/password.util';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(PeopleEntity)
    private readonly peopleRepository: Repository<PeopleEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
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
      relations: { user: true },
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

    // Validate userId if provided for STAFF
    if (type === PeopleType.STAFF && dto.userId) {
      const user = await this.usersRepository.findOne({
        where: { id: dto.userId },
      });

      if (!user || user.isSuperAdmin) {
        throw new NotFoundException(USER_ERRORS.NOT_FOUND.message);
      }

      const existingLink = await this.peopleRepository.findOne({
        where: { userId: dto.userId, type: PeopleType.STAFF },
      });

      if (existingLink) {
        throw new ConflictException(PEOPLE_ERRORS.USER_ALREADY_LINKED.message);
      }
    }

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
      userId: type === PeopleType.STAFF ? (dto.userId ?? null) : null,
    });

    const saved = await this.peopleRepository.save(person);

    // If we linked a user, return with relation loaded
    if (saved.userId) {
      return this.findOne(tenantId, saved.id);
    }

    return saved;
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

  async searchInvitableUsersForStaff(query: InvitableUsersQueryDto): Promise<{
    items: Array<{ id: string; email: string; fullName?: string }>;
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    // Get users already linked to any staff record (across all tenants)
    const linkedUserIds = await this.peopleRepository
      .createQueryBuilder('people')
      .select('people.userId')
      .where('people.userId IS NOT NULL')
      .andWhere('people.type = :type', { type: PeopleType.STAFF })
      .getMany()
      .then((results) => results.map((p) => p.userId).filter(Boolean));

    // Build query for users not linked and not super admins
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.isSuperAdmin = :isSuperAdmin', { isSuperAdmin: false })
      .andWhere('user.status = :status', { status: 'ACTIVE' });

    // Exclude users already linked to staff
    if (linkedUserIds.length > 0) {
      queryBuilder.andWhere('user.id NOT IN (:...linkedUserIds)', {
        linkedUserIds,
      });
    }

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const users = await queryBuilder
      .select(['user.id', 'user.email', 'user.fullName'])
      .orderBy('user.email', 'ASC')
      .skip(calculateSkip(page, limit))
      .take(limit)
      .getMany();

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async linkUser(
    tenantId: string,
    personId: string,
    dto: LinkUserDto,
  ): Promise<PeopleEntity> {
    const person = await this.findOne(tenantId, personId);

    // Validate person is type STAFF
    if (person.type !== PeopleType.STAFF) {
      throw new BadRequestException(PEOPLE_ERRORS.NOT_STAFF_RECORD.message);
    }

    // Check user exists and is not super admin
    const user = await this.usersRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user || user.isSuperAdmin) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND.message);
    }

    // Check user is not already linked to any staff record
    const existingLink = await this.peopleRepository.findOne({
      where: { userId: dto.userId, type: PeopleType.STAFF },
    });

    if (existingLink && existingLink.id !== personId) {
      throw new ConflictException(PEOPLE_ERRORS.USER_ALREADY_LINKED.message);
    }

    person.userId = dto.userId;
    await this.peopleRepository.save(person);
    return this.findOne(tenantId, personId);
  }

  async unlinkUser(tenantId: string, personId: string): Promise<PeopleEntity> {
    const person = await this.findOne(tenantId, personId);

    // Validate person is type STAFF
    if (person.type !== PeopleType.STAFF) {
      throw new BadRequestException(PEOPLE_ERRORS.NOT_STAFF_RECORD.message);
    }

    await this.peopleRepository.update(
      { id: personId, tenantId },
      { userId: null },
    );

    // Return fresh entity
    return this.findOne(tenantId, personId);
  }

  async createUserForStaff(
    tenantId: string,
    personId: string,
    dto: CreateUserForStaffDto,
  ): Promise<PeopleEntity> {
    const person = await this.findOne(tenantId, personId);

    // Validate person is type STAFF
    if (person.type !== PeopleType.STAFF) {
      throw new BadRequestException(PEOPLE_ERRORS.NOT_STAFF_RECORD.message);
    }

    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(USER_ERRORS.EMAIL_EXISTS.message);
    }

    const attachToTenant = dto.attachToTenant !== false;

    // Validate role if attaching to tenant
    let role: RoleEntity | null = null;
    if (attachToTenant && dto.roleId) {
      role = await this.roleRepository.findOne({
        where: { id: dto.roleId, tenantId },
      });
      if (!role) {
        throw new NotFoundException(ROLE_ERRORS.NOT_FOUND_IN_TENANT.message);
      }
    }

    // Create new user
    const hashedPassword = await hashPassword(dto.tempPassword);
    const user = this.usersRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash: hashedPassword,
      status: 'ACTIVE',
    });
    await this.usersRepository.save(user);

    // Attach to tenant if requested
    if (attachToTenant) {
      const membership = this.tenantUserRepository.create({
        tenantId,
        userId: user.id,
        roleId: dto.roleId || undefined,
      });
      await this.tenantUserRepository.save(membership);
    }

    // Link user to staff record
    person.userId = user.id;
    await this.peopleRepository.save(person);

    return this.findOne(tenantId, personId);
  }
}
