import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { TenantCountersService } from '../../tenant-counters/tenant-counters.service';
import {
  CategoryEntity,
  CategoryStatus,
} from '../../../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import {
  PaginatedResponse,
  calculateSkip,
  paginate,
} from '../../../common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly tenantCountersService: TenantCountersService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, tenantId: string) {
    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId, tenantId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      if (parent.parentId) {
        throw new BadRequestException(
          'Tree depth max 2 levels (root + one child)',
        );
      }
    }

    const code = await this.tenantCountersService.getNextCategoryCode(tenantId);

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      tenantId,
      code,
    });

    return this.categoryRepository.save(category);
  }

  async findAll(
    query: CategoryQueryDto,
    tenantId: string,
  ): Promise<PaginatedResponse<CategoryEntity>> {
    const { search, status, parentId, limit = 10, page = 1 } = query;

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .where('category.tenantId = :tenantId', { tenantId });

    if (search) {
      queryBuilder.andWhere(
        '(category.name ILIKE :search OR category.code ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('category.status = :status', { status });
    }

    if (parentId) {
      queryBuilder.andWhere('category.parentId = :parentId', { parentId });
    }

    queryBuilder
      .orderBy('category.createdAt', 'DESC')
      .skip(calculateSkip(page, limit))
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return paginate(items, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
      relations: { parent: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    tenantId: string,
  ) {
    const category = await this.findOne(id, tenantId);

    if (
      updateCategoryDto.parentId &&
      updateCategoryDto.parentId !== category.parentId
    ) {
      const parent = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId, tenantId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      if (parent.parentId) {
        throw new BadRequestException(
          'Tree depth max 2 levels (root + one child)',
        );
      }

      // Also prevent self-parenting
      if (parent.id === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
    }

    // Name uniqueness check
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingName = await this.categoryRepository.findOne({
        where: {
          tenantId,
          name: updateCategoryDto.name,
          id: Not(id),
        },
      });
      if (existingName) {
        throw new BadRequestException('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string, tenantId: string) {
    const category = await this.findOne(id, tenantId);

    category.status = CategoryStatus.INACTIVE;

    return this.categoryRepository.save(category);
  }
}
