import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantTaxesTable1767000000002 implements MigrationInterface {
  name = 'CreateTenantTaxesTable1767000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "tenant_taxes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "taxId" uuid NOT NULL,
                "isDefault" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "createdBy" uuid,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedBy" uuid,
                "deletedAt" TIMESTAMP,
                "deletedBy" uuid,
                CONSTRAINT "UQ_tenant_taxes_tenant_tax" UNIQUE ("tenantId", "taxId"),
                CONSTRAINT "PK_tenant_taxes_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "tenant_taxes" 
            ADD CONSTRAINT "FK_tenant_taxes_tenantId" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "tenant_taxes" 
            ADD CONSTRAINT "FK_tenant_taxes_taxId" 
            FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "FK_tenant_taxes_taxId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "FK_tenant_taxes_tenantId"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_taxes"`);
  }
}
