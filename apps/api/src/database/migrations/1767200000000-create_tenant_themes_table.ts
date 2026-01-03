import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantThemesTable1767200000000 implements MigrationInterface {
  name = 'CreateTenantThemesTable1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "tenant_themes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "presetId" varchar(255) NOT NULL,
                "logoUrl" varchar(500),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "createdBy" uuid,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedBy" uuid,
                "deletedAt" TIMESTAMP,
                "deletedBy" uuid,
                CONSTRAINT "UQ_tenant_themes_tenantId" UNIQUE ("tenantId"),
                CONSTRAINT "PK_tenant_themes_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "tenant_themes" 
            ADD CONSTRAINT "FK_tenant_themes_tenantId" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_themes" DROP CONSTRAINT "FK_tenant_themes_tenantId"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_themes"`);
  }
}
