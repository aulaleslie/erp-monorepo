import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PeopleType } from '@gym-monorepo/shared';
import { TenantCounterEntity } from '../../database/entities';

const PEOPLE_COUNTERS: Record<PeopleType, { key: string; prefix: string }> = {
  [PeopleType.CUSTOMER]: { key: 'people.customer', prefix: 'CUS-' },
  [PeopleType.SUPPLIER]: { key: 'people.supplier', prefix: 'SUP-' },
  [PeopleType.STAFF]: { key: 'people.staff', prefix: 'STF-' },
};

const DEPARTMENT_COUNTER = { key: 'departments', prefix: 'DEP-' };
const CATEGORY_COUNTER = { key: 'categories', prefix: 'CAT-' };
const ITEM_COUNTER = { key: 'items', prefix: 'SKU-' };
const MEMBER_COUNTER = { key: 'members', prefix: 'MBR-' };

@Injectable()
export class TenantCountersService {
  constructor(private readonly dataSource: DataSource) {}

  async getNextMemberCode(tenantId: string): Promise<string> {
    const nextValue = await this.nextValue(
      tenantId,
      MEMBER_COUNTER.key,
      MEMBER_COUNTER.prefix,
    );

    return this.formatCode(MEMBER_COUNTER.prefix, nextValue);
  }

  async getNextPeopleCode(tenantId: string, type: PeopleType): Promise<string> {
    const counterConfig = PEOPLE_COUNTERS[type];
    if (!counterConfig) {
      throw new InternalServerErrorException('Unknown people counter type');
    }

    const nextValue = await this.nextValue(
      tenantId,
      counterConfig.key,
      counterConfig.prefix,
    );

    return this.formatCode(counterConfig.prefix, nextValue);
  }

  async getNextDepartmentCode(tenantId: string): Promise<string> {
    const nextValue = await this.nextValue(
      tenantId,
      DEPARTMENT_COUNTER.key,
      DEPARTMENT_COUNTER.prefix,
    );

    return this.formatCode(DEPARTMENT_COUNTER.prefix, nextValue);
  }

  async getNextCategoryCode(tenantId: string): Promise<string> {
    const nextValue = await this.nextValue(
      tenantId,
      CATEGORY_COUNTER.key,
      CATEGORY_COUNTER.prefix,
    );

    return this.formatCode(CATEGORY_COUNTER.prefix, nextValue);
  }

  async getNextItemCode(tenantId: string): Promise<string> {
    const nextValue = await this.nextValue(
      tenantId,
      ITEM_COUNTER.key,
      ITEM_COUNTER.prefix,
    );

    return this.formatCode(ITEM_COUNTER.prefix, nextValue);
  }

  private async nextValue(
    tenantId: string,
    key: string,
    prefix: string,
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(TenantCounterEntity);
      let counter = await this.findForUpdate(repository, tenantId, key);

      if (!counter) {
        await this.insertIfMissing(repository, tenantId, key);
        counter = await this.findForUpdate(repository, tenantId, key);
      }

      if (!counter) {
        throw new InternalServerErrorException(
          `Failed to initialize counter for ${prefix}`,
        );
      }

      counter.value += 1;
      await repository.save(counter);

      return counter.value;
    });
  }

  private async findForUpdate(
    repository: Repository<TenantCounterEntity>,
    tenantId: string,
    key: string,
  ): Promise<TenantCounterEntity | null> {
    return repository
      .createQueryBuilder('counter')
      .setLock('pessimistic_write')
      .where('counter.tenantId = :tenantId', { tenantId })
      .andWhere('counter.key = :key', { key })
      .getOne();
  }

  private async insertIfMissing(
    repository: Repository<TenantCounterEntity>,
    tenantId: string,
    key: string,
  ): Promise<void> {
    await repository
      .createQueryBuilder()
      .insert()
      .into(TenantCounterEntity)
      .values({ tenantId, key, value: 0 })
      .orIgnore()
      .execute();
  }

  private formatCode(prefix: string, value: number): string {
    return `${prefix}${String(value).padStart(6, '0')}`;
  }
}
