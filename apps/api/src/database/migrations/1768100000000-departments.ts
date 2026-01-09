import { MigrationInterface, QueryRunner } from 'typeorm';

export class Departments1768100000000 implements MigrationInterface {
  name = 'Departments1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create department status enum
    await queryRunner.query(
      `CREATE TYPE "public"."departments_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );

    // Create departments table
    await queryRunner.query(
      `CREATE TABLE "departments" (
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "status" "public"."departments_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "UQ_departments_tenant_code" UNIQUE ("tenantId", "code"),
        CONSTRAINT "PK_departments" PRIMARY KEY ("id")
      )`,
    );

    // Create unique index for tenant + name
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_departments_tenant_name" ON "departments" ("tenantId", "name") WHERE "name" IS NOT NULL`,
    );

    // Add foreign key to tenants
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "FK_departments_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "FK_departments_tenantId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_departments_tenant_name"`);
    await queryRunner.query(`DROP TABLE "departments"`);
    await queryRunner.query(`DROP TYPE "public"."departments_status_enum"`);
  }
}
