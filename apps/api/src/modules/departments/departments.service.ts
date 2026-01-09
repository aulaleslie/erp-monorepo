import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from '../../database/entities';
import { DEPARTMENT_ERRORS, DepartmentStatus } from '@gym-monorepo/shared';
import {
  PaginatedResponse,
  calculateSkip,
  paginate,
} from '../../common/dto/pagination.dto';
import { TenantCountersService } from '../tenant-counters/tenant-counters.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentQueryDto } from './dto/department-query.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    private readonly tenantCountersService: TenantCountersService,
  ) {}

  async findAll(
    tenantId: string,
    query: DepartmentQueryDto,
  ): Promise<PaginatedResponse<DepartmentEntity>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? DepartmentStatus.ACTIVE;
    const search = query.search?.trim();

    const qb = this.departmentRepository.createQueryBuilder('department');
    qb.where('department.tenantId = :tenantId', { tenantId });

    if (status) {
      qb.andWhere('department.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(department.code ILIKE :search OR department.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('department.createdAt', 'DESC')
      .skip(calculateSkip(page, limit))
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, page, limit);
  }

  async findOne(tenantId: string, id: string): Promise<DepartmentEntity> {
    const department = await this.departmentRepository.findOne({
      where: { id, tenantId },
    });

    if (!department) {
      throw new NotFoundException(DEPARTMENT_ERRORS.NOT_FOUND.message);
    }

    return department;
  }

  async create(
    tenantId: string,
    dto: CreateDepartmentDto,
  ): Promise<DepartmentEntity> {
    const name = dto.name.trim();

    await this.assertNameUnique(tenantId, name);

    const code =
      await this.tenantCountersService.getNextDepartmentCode(tenantId);

    const department = this.departmentRepository.create({
      tenantId,
      code,
      name,
      status: DepartmentStatus.ACTIVE,
    });

    return this.departmentRepository.save(department);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentEntity> {
    const department = await this.findOne(tenantId, id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      await this.assertNameUnique(tenantId, name, department.id);
      department.name = name;
    }

    if (dto.status !== undefined) {
      department.status = dto.status;
    }

    return this.departmentRepository.save(department);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const department = await this.findOne(tenantId, id);
    department.status = DepartmentStatus.INACTIVE;
    await this.departmentRepository.save(department);
  }

  private async assertNameUnique(
    tenantId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.departmentRepository.findOne({
      where: { tenantId, name },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(DEPARTMENT_ERRORS.DUPLICATE_NAME.message);
    }
  }
}
