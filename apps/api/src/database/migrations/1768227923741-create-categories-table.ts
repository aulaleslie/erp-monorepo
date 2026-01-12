import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1768227923741 implements MigrationInterface {
  name = 'CreateCategoriesTable1768227923741';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "FK_tenant_taxes_tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "FK_tenant_taxes_taxId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_themes" DROP CONSTRAINT "FK_tenant_themes_tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "FK_departments_tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" DROP CONSTRAINT "FK_people_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" DROP CONSTRAINT "FK_people_departmentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_counters" DROP CONSTRAINT "FK_tenant_counters_tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "UQ_tenant_taxes_tenant_tax"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."categories_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "parentId" uuid, "name" character varying NOT NULL, "code" character varying NOT NULL, "status" "public"."categories_status_enum" NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "UQ_categories_tenant_name" UNIQUE ("tenantId", "name"), CONSTRAINT "UQ_categories_tenant_code" UNIQUE ("tenantId", "code"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "tenant_users" DROP COLUMN "roleId"`);
    await queryRunner.query(`ALTER TABLE "tenant_users" ADD "roleId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" ADD CONSTRAINT "UQ_7f0c31cfba81c313b7ec96aacc3" UNIQUE ("tenantId", "taxId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "UQ_d430a02aad006d8a70f3acd7d03" UNIQUE ("roleId", "permissionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" ADD CONSTRAINT "UQ_8fa3e63dcfe2fe25531f8849e45" UNIQUE ("tenantId", "userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" ADD CONSTRAINT "FK_3f80af41b91c3d52f0de37edcf5" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" ADD CONSTRAINT "FK_e053bf41bf0e40ad4f953f82a0f" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_themes" ADD CONSTRAINT "FK_70bcc53fc870790c7b47f57cda3" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_46a85229c9953b2b94f768190b2" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "FK_617394da01e48b2fea5dc80fe23" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ADD CONSTRAINT "FK_ec4800607fce2eb72e3c44580d3" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ADD CONSTRAINT "FK_5978ff8495186990c2954e4b59b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_counters" ADD CONSTRAINT "FK_e1cbc78fa41e47abf21f50d5807" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_counters" DROP CONSTRAINT "FK_e1cbc78fa41e47abf21f50d5807"`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" DROP CONSTRAINT "FK_5978ff8495186990c2954e4b59b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" DROP CONSTRAINT "FK_ec4800607fce2eb72e3c44580d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "FK_617394da01e48b2fea5dc80fe23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_46a85229c9953b2b94f768190b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_themes" DROP CONSTRAINT "FK_70bcc53fc870790c7b47f57cda3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "FK_e053bf41bf0e40ad4f953f82a0f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "FK_3f80af41b91c3d52f0de37edcf5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP CONSTRAINT "UQ_8fa3e63dcfe2fe25531f8849e45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "UQ_d430a02aad006d8a70f3acd7d03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "UQ_7f0c31cfba81c313b7ec96aacc3"`,
    );
    await queryRunner.query(`ALTER TABLE "tenant_users" DROP COLUMN "roleId"`);
    await queryRunner.query(
      `ALTER TABLE "tenant_users" ADD "roleId" character varying`,
    );
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TYPE "public"."categories_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" ADD CONSTRAINT "UQ_tenant_taxes_tenant_tax" UNIQUE ("tenantId", "taxId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_counters" ADD CONSTRAINT "FK_tenant_counters_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ADD CONSTRAINT "FK_people_departmentId" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ADD CONSTRAINT "FK_people_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "FK_departments_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_themes" ADD CONSTRAINT "FK_tenant_themes_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" ADD CONSTRAINT "FK_tenant_taxes_taxId" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" ADD CONSTRAINT "FK_tenant_taxes_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
