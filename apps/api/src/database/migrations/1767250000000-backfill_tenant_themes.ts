import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillTenantThemes1767250000000 implements MigrationInterface {
  name = 'BackfillTenantThemes1767250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create default themes for all tenants that don't have one
    await queryRunner.query(`
      INSERT INTO "tenant_themes" ("tenantId", "presetId", "createdAt", "updatedAt")
      SELECT id, 'corporate-blue', NOW(), NOW()
      FROM tenants
      WHERE id NOT IN (SELECT DISTINCT "tenantId" FROM "tenant_themes")
      ON CONFLICT ("tenantId") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove themes that were created by this migration
    // This only removes themes with the default preset for tenants that had no themes before
    await queryRunner.query(`
      DELETE FROM "tenant_themes"
      WHERE "presetId" = 'corporate-blue'
      AND "tenantId" NOT IN (
        SELECT DISTINCT "tenantId" FROM "tenant_themes"
        WHERE "presetId" != 'corporate-blue'
      );
    `);
  }
}
