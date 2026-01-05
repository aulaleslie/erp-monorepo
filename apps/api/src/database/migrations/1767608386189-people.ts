import { MigrationInterface, QueryRunner } from 'typeorm';

export class People1767608386189 implements MigrationInterface {
  name = 'People1767608386189';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."people_type_enum" AS ENUM('CUSTOMER', 'SUPPLIER', 'STAFF')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."people_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "people" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "type" "public"."people_type_enum" NOT NULL, "code" character varying NOT NULL, "fullName" character varying NOT NULL, "email" character varying, "phone" character varying, "status" "public"."people_status_enum" NOT NULL DEFAULT 'ACTIVE', "tags" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "UQ_people_tenant_code" UNIQUE ("tenantId", "code"), CONSTRAINT "PK_aa866e71353ee94c6cc51059c5b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_people_tenant_phone" ON "people" ("tenantId", "phone") WHERE "phone" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_people_tenant_email" ON "people" ("tenantId", "email") WHERE "email" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_people_tenant_email"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_people_tenant_phone"`);
    await queryRunner.query(`DROP TABLE "people"`);
    await queryRunner.query(`DROP TYPE "public"."people_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."people_type_enum"`);
  }
}
