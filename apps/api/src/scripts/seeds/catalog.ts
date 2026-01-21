import { DataSource, IsNull } from 'typeorm';
import {
  CategoryEntity,
  CategoryStatus,
  ItemDurationUnit,
  ItemEntity,
  ItemServiceKind,
  ItemStatus,
  ItemType,
  TenantEntity,
} from '../../database/entities';
import { TenantType } from '@gym-monorepo/shared';
import { TenantCountersService } from '../../modules/tenant-counters/tenant-counters.service';

export const seedCatalog = async (dataSource: DataSource): Promise<void> => {
  console.log('Seeding Catalog (Gym Defaults)...');
  const tenantRepo = dataSource.getRepository(TenantEntity);
  const categoryRepo = dataSource.getRepository(CategoryEntity);
  const itemRepo = dataSource.getRepository(ItemEntity);
  const tenantCountersService = new TenantCountersService(dataSource);

  const gymTenants = await tenantRepo.find({
    where: { type: TenantType.GYM },
  });

  if (gymTenants.length === 0) {
    console.log('No Gym tenants found. Skipping catalog seeding.');
    return;
  }

  for (const tenant of gymTenants) {
    console.log(`Seeding catalog for tenant: ${tenant.name} (${tenant.id})`);

    // 1. Seed Categories
    const categoriesToSeed = [
      { name: 'Memberships' },
      { name: 'Services' },
      { name: 'Supplements' },
      { name: 'Beverages' },
      { name: 'Merchandise' },
    ];

    const categoryMap: Record<string, CategoryEntity> = {};

    for (const catData of categoriesToSeed) {
      let category = await categoryRepo.findOneBy({
        tenantId: tenant.id,
        name: catData.name,
      });

      if (!category) {
        const code = await tenantCountersService.getNextCategoryCode(tenant.id);
        category = await categoryRepo.save(
          categoryRepo.create({
            tenantId: tenant.id,
            name: catData.name,
            code,
            status: CategoryStatus.ACTIVE,
          }),
        );
      }
      categoryMap[catData.name] = category;
    }

    // Seed Child Category: Personal Training under Services
    const servicesCategory = categoryMap['Services'];
    let ptCategory = await categoryRepo.findOneBy({
      tenantId: tenant.id,
      name: 'Personal Training',
      parentId: servicesCategory.id,
    });

    if (!ptCategory) {
      const code = await tenantCountersService.getNextCategoryCode(tenant.id);
      ptCategory = await categoryRepo.save(
        categoryRepo.create({
          tenantId: tenant.id,
          name: 'Personal Training',
          code,
          parentId: servicesCategory.id,
          status: CategoryStatus.ACTIVE,
        }),
      );
    }
    categoryMap['Personal Training'] = ptCategory;

    // 2. Seed Items
    const itemsToSeed = [
      // Memberships
      {
        name: 'Monthly Membership',
        type: ItemType.SERVICE,
        serviceKind: ItemServiceKind.MEMBERSHIP,
        category: 'Memberships',
        price: 500000,
        durationValue: 30,
        durationUnit: ItemDurationUnit.DAY,
      },
      {
        name: 'Quarterly Membership',
        type: ItemType.SERVICE,
        serviceKind: ItemServiceKind.MEMBERSHIP,
        category: 'Memberships',
        price: 1350000,
        durationValue: 90,
        durationUnit: ItemDurationUnit.DAY,
      },
      {
        name: 'Annual Membership',
        type: ItemType.SERVICE,
        serviceKind: ItemServiceKind.MEMBERSHIP,
        category: 'Memberships',
        price: 5000000,
        durationValue: 365,
        durationUnit: ItemDurationUnit.DAY,
      },
      // PT Sessions
      {
        name: 'Single PT Session',
        type: ItemType.SERVICE,
        serviceKind: ItemServiceKind.PT_SESSION,
        category: 'Personal Training',
        price: 250000,
        sessionCount: 1,
        durationValue: 30,
        durationUnit: ItemDurationUnit.DAY,
      },
      {
        name: 'PT Package (12 Sessions)',
        type: ItemType.SERVICE,
        serviceKind: ItemServiceKind.PT_SESSION,
        category: 'Personal Training',
        price: 2400000,
        sessionCount: 12,
        durationValue: 30,
        durationUnit: ItemDurationUnit.DAY,
      },
      // Products
      {
        name: 'Vitamin C 1000mg',
        type: ItemType.PRODUCT,
        category: 'Supplements',
        price: 50000,
        unit: 'Bottle',
      },
      {
        name: 'Mineral Water 600ml',
        type: ItemType.PRODUCT,
        category: 'Beverages',
        price: 5000,
        unit: 'Bottle',
      },
    ];

    for (const itemData of itemsToSeed) {
      const category = categoryMap[itemData.category];
      const item = await itemRepo.findOneBy({
        tenantId: tenant.id,
        name: itemData.name,
        type: itemData.type,
        categoryId: category?.id || IsNull(),
      });

      if (!item) {
        const code = await tenantCountersService.getNextItemCode(tenant.id);
        await itemRepo.save(
          itemRepo.create({
            tenantId: tenant.id,
            categoryId: category?.id || null,
            type: itemData.type,
            serviceKind: itemData.serviceKind || null,
            code,
            name: itemData.name,
            price: itemData.price,
            status: ItemStatus.ACTIVE,
            unit: itemData.unit || null,
            durationValue: itemData.durationValue || null,
            durationUnit: itemData.durationUnit || null,
            sessionCount: itemData.sessionCount || null,
          }),
        );
      }
    }
  }
};
