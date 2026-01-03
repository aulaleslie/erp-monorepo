import { DataSource } from 'typeorm';
import { TenantEntity } from '../src/database/entities/tenant.entity';
import {
  TaxEntity,
  TaxType,
  TaxStatus,
} from '../src/database/entities/tax.entity';
import { TenantTaxEntity } from '../src/database/entities/tenant-tax.entity';
import { config } from 'dotenv';

config();

async function verify() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'gym_monorepo',
    entities: [TenantEntity, TaxEntity, TenantTaxEntity],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Create a Tenant
    const tenant = new TenantEntity();
    tenant.name = 'Test Tenant Verification';
    tenant.slug = 'test-tenant-verification-' + Date.now();
    tenant.isTaxable = true;
    await dataSource.manager.save(tenant);
    console.log('Tenant created:', tenant.id);

    // Create a Tax
    const tax = new TaxEntity();
    tax.name = 'Test Tax Verification';
    tax.code = 'TAX-VERIFY-' + Date.now();
    tax.type = TaxType.PERCENTAGE;
    tax.rate = 0.1;
    tax.status = TaxStatus.ACTIVE;
    await dataSource.manager.save(tax);
    console.log('Tax created:', tax.id);

    // Create TenantTax map
    const tenantTax = new TenantTaxEntity();
    tenantTax.tenant = tenant;
    tenantTax.tax = tax;
    tenantTax.isDefault = true;
    await dataSource.manager.save(tenantTax);
    console.log('TenantTax created:', tenantTax.id);

    // Verify retrieval
    const savedTenantTax = await dataSource.manager.findOne(TenantTaxEntity, {
      where: { id: tenantTax.id },
      relations: ['tenant', 'tax'],
    });

    if (!savedTenantTax) throw new Error('TenantTax not found');
    if (savedTenantTax.tenant.id !== tenant.id)
      throw new Error('Tenant mismatch');
    if (savedTenantTax.tax.id !== tax.id) throw new Error('Tax mismatch');
    if (savedTenantTax.isDefault !== true)
      throw new Error('isDefault mismatch');

    console.log('Verification successful!');

    // Cleanup
    await dataSource.manager.remove(tenantTax);
    await dataSource.manager.remove(tax);
    await dataSource.manager.remove(tenant);
    console.log('Cleanup successful');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

verify();
