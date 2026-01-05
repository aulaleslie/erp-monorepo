import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PeopleType } from '@gym-monorepo/shared';
import { TenantCounterEntity } from '../../database/entities';

const PEOPLE_COUNTERS: Record<PeopleType, { key: string; prefix: string }> = {
  [PeopleType.CUSTOMER]: { key: 'people.customer', prefix: 'CUS-' },
  [PeopleType.SUPPLIER]: { key: 'people.supplier', prefix: 'SUP-' },
  [PeopleType.STAFF]: { key: 'people.staff', prefix: 'STF-' },
};

@Injectable()
export class TenantCountersService {
  constructor(private readonly dataSource: DataSource) {}

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
