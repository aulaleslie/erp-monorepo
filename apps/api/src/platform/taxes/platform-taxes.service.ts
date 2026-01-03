import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxEntity, TaxStatus, TaxType } from '../../database/entities/tax.entity';
import { TenantTaxEntity } from '../../database/entities/tenant-tax.entity';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { TaxQueryDto } from './dto/tax-query.dto';
import { paginate, PaginatedResponse, calculateSkip } from '../../common/dto/pagination.dto';
import { TAX_ERRORS } from '@gym-monorepo/shared';

@Injectable()
export class PlatformTaxesService {
  constructor(
    @InjectRepository(TaxEntity)
    private taxRepository: Repository<TaxEntity>,
    @InjectRepository(TenantTaxEntity)
    private tenantTaxRepository: Repository<TenantTaxEntity>,
  ) {}

  private async assertNotInUse(id: string): Promise<void> {
    const usageCount = await this.tenantTaxRepository.count({ where: { taxId: id } });
    if (usageCount > 0) {
      throw new BadRequestException(TAX_ERRORS.IN_USE_BY_TENANTS.message);
    }
  }

  async create(createTaxDto: CreateTaxDto): Promise<TaxEntity> {
    // Validate uniqueness of code if provided
    if (createTaxDto.code) {
      const existing = await this.taxRepository.findOne({ where: { code: createTaxDto.code } });
      if (existing) {
        throw new BadRequestException(TAX_ERRORS.CODE_EXISTS.message);
      }
    }

    // Additional validation logic can be here, though DTO handles most
    if (createTaxDto.type === TaxType.PERCENTAGE && createTaxDto.rate === undefined) {
       throw new BadRequestException(TAX_ERRORS.RATE_REQUIRED.message);
    }
    if (createTaxDto.type === TaxType.FIXED && createTaxDto.amount === undefined) {
       throw new BadRequestException(TAX_ERRORS.AMOUNT_REQUIRED.message);
    }

    const tax = this.taxRepository.create(createTaxDto);
    return this.taxRepository.save(tax);
  }

  async findAll(query: TaxQueryDto): Promise<PaginatedResponse<TaxEntity>> {
    const { page = 1, limit = 10, search, status } = query;
    const skip = calculateSkip(page, limit);

    const qb = this.taxRepository.createQueryBuilder('tax');
    qb.loadRelationCountAndMap('tax.tenantUsageCount', 'tax.tenantTaxes');

    if (search) {
      qb.andWhere('(tax.name ILIKE :search OR tax.code ILIKE :search)', { search: `%${search}%` });
    }

    if (status) {
      qb.andWhere('tax.status = :status', { status });
    }

    qb.skip(skip).take(limit).orderBy('tax.createdAt', 'DESC');

    const [items, total] = await qb.getManyAndCount();

    return paginate(items, total, page, limit);
  }

  async findOne(id: string): Promise<TaxEntity> {
    const tax = await this.taxRepository.findOne({ where: { id } });
    if (!tax) {
      throw new NotFoundException(TAX_ERRORS.NOT_FOUND.message);
    }
    return tax;
  }

  async update(id: string, updateTaxDto: UpdateTaxDto): Promise<TaxEntity> {
    const tax = await this.findOne(id);
    await this.assertNotInUse(id);

    if (updateTaxDto.code && updateTaxDto.code !== tax.code) {
        const existing = await this.taxRepository.findOne({ where: { code: updateTaxDto.code } });
        if (existing) {
          throw new BadRequestException(TAX_ERRORS.CODE_EXISTS.message);
        }
    }
    
    // Validate logic for type change or rate/amount updates if necessary
    // Here we trust DTO but can add cross-field checks if needed
     if (updateTaxDto.type === TaxType.PERCENTAGE && !updateTaxDto.rate && !tax.rate) {
         // If switching to PERCENTAGE without providing rate, and no rate existed (e.g. was FIXED)
         // But type default is PERCENTAGE, so maybe check more carefully.
         // Simpler: just merge and save, if specific validations needed, add them.
         // DTO doesn't enforce 'rate if type is PERCENTAGE' on update well because it's partial.
         // We can enforce consistency:
    }
    
    // For now simple merge
    Object.assign(tax, updateTaxDto);
    
    // Sanity check after merge
    if (tax.type === TaxType.PERCENTAGE && (tax.rate === null || tax.rate === undefined)) {
         throw new BadRequestException(TAX_ERRORS.RATE_REQUIRED.message);
    }
    if (tax.type === TaxType.FIXED && (tax.amount === null || tax.amount === undefined)) {
         throw new BadRequestException(TAX_ERRORS.AMOUNT_REQUIRED.message);
    }

    return this.taxRepository.save(tax);
  }

  async remove(id: string): Promise<void> {
    const tax = await this.findOne(id);
    await this.assertNotInUse(id);
    tax.status = TaxStatus.INACTIVE;
    await this.taxRepository.save(tax);
  }
}
