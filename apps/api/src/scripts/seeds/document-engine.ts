import { DataSource } from 'typeorm';
import {
  ChartOfAccountsEntity,
  CostCenterEntity,
  TenantEntity,
} from '../../database/entities';
import { AccountType } from '@gym-monorepo/shared';

export const seedDocumentEngine = async (
  dataSource: DataSource,
): Promise<void> => {
  console.log('Seeding Document Engine Defaults...');
  const tenantRepo = dataSource.getRepository(TenantEntity);
  const coaRepo = dataSource.getRepository(ChartOfAccountsEntity);
  const costCenterRepo = dataSource.getRepository(CostCenterEntity);

  const tenants = await tenantRepo.find();

  if (tenants.length === 0) {
    console.log('No tenants found. Skipping document engine seeding.');
    return;
  }

  for (const tenant of tenants) {
    console.log(
      `Seeding document engine for tenant: ${tenant.name} (${tenant.id})`,
    );

    // 1. Seed Chart of Accounts
    const coaToSeed = [
      { code: '1000', name: 'Cash', type: AccountType.ASSET },
      { code: '1100', name: 'Accounts Receivable', type: AccountType.ASSET },
      { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY },
      { code: '4000', name: 'Sales Revenue', type: AccountType.REVENUE },
      { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
    ];

    for (const coaData of coaToSeed) {
      const existing = await coaRepo.findOneBy({
        tenantId: tenant.id,
        code: coaData.code,
      });

      if (!existing) {
        await coaRepo.save(
          coaRepo.create({
            tenantId: tenant.id,
            code: coaData.code,
            name: coaData.name,
            type: coaData.type,
            isActive: true,
          }),
        );
      }
    }

    // 2. Seed Cost Centers
    const costCentersToSeed = [
      { code: 'GEN', name: 'General' },
      { code: 'OPS', name: 'Operations' },
      { code: 'ADM', name: 'Administration' },
    ];

    for (const ccData of costCentersToSeed) {
      const existing = await costCenterRepo.findOneBy({
        tenantId: tenant.id,
        code: ccData.code,
      });

      if (!existing) {
        await costCenterRepo.save(
          costCenterRepo.create({
            tenantId: tenant.id,
            code: ccData.code,
            name: ccData.name,
            isActive: true,
          }),
        );
      }
    }
  }
};
