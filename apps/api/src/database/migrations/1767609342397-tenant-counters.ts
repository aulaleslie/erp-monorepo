import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantCounters1767609342397 implements MigrationInterface {
  name = 'TenantCounters1767609342397';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenant_counters" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "key" character varying NOT NULL,
        "value" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "UQ_tenant_counters_tenant_key" UNIQUE ("tenantId", "key"),
        CONSTRAINT "PK_tenant_counters_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenant_counters"`);
  }
}
