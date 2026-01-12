import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItemsTable1768228482047 implements MigrationInterface {
  name = 'CreateItemsTable1768228482047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."items_type_enum" AS ENUM('PRODUCT', 'SERVICE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."items_servicekind_enum" AS ENUM('MEMBERSHIP', 'PT_SESSION')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."items_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."items_durationunit_enum" AS ENUM('DAY', 'WEEK', 'MONTH', 'YEAR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "items" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "categoryId" uuid, "type" "public"."items_type_enum" NOT NULL, "serviceKind" "public"."items_servicekind_enum", "code" character varying NOT NULL, "name" character varying NOT NULL, "price" numeric(12,2) NOT NULL, "status" "public"."items_status_enum" NOT NULL DEFAULT 'ACTIVE', "barcode" character varying, "unit" character varying, "tags" jsonb NOT NULL DEFAULT '[]', "description" text, "durationValue" integer, "durationUnit" "public"."items_durationunit_enum", "sessionCount" integer, "includedPtSessions" integer, "imageKey" character varying, "imageUrl" character varying, "imageMimeType" character varying, "imageSize" integer, CONSTRAINT "UQ_items_tenant_name_category" UNIQUE ("tenantId", "name", "type", "categoryId"), CONSTRAINT "UQ_items_tenant_code" UNIQUE ("tenantId", "code"), CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_items_tenant_name_category_null" ON "items" ("tenantId", "name", "type") WHERE "categoryId" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_items_tenant_barcode" ON "items" ("tenantId", "barcode") WHERE "barcode" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "items" ADD CONSTRAINT "FK_32406202861088bf509dfae09f4" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "items" ADD CONSTRAINT "FK_788929ed61ab78bb914f0d1931b" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "items" DROP CONSTRAINT "FK_788929ed61ab78bb914f0d1931b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "items" DROP CONSTRAINT "FK_32406202861088bf509dfae09f4"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_items_tenant_barcode"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_items_tenant_name_category_null"`,
    );
    await queryRunner.query(`DROP TABLE "items"`);
    await queryRunner.query(`DROP TYPE "public"."items_durationunit_enum"`);
    await queryRunner.query(`DROP TYPE "public"."items_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."items_servicekind_enum"`);
    await queryRunner.query(`DROP TYPE "public"."items_type_enum"`);
  }
}
