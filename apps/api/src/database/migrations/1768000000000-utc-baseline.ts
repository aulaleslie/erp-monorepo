import { MigrationInterface, QueryRunner } from 'typeorm';

export class UtcBaseline1768000000000 implements MigrationInterface {
  name = 'UtcBaseline1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'DISABLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenants_status_enum" AS ENUM('ACTIVE', 'DISABLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenants_type_enum" AS ENUM('GYM', 'EATERY', 'COMPUTER_STORE', 'GROCERY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenants_language_enum" AS ENUM('en', 'id')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."taxes_type_enum" AS ENUM('PERCENTAGE', 'FIXED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."taxes_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "fullName" character varying,
        "isSuperAdmin" boolean NOT NULL DEFAULT false,
        "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "type" "public"."tenants_type_enum" NOT NULL DEFAULT 'GYM',
        "language" "public"."tenants_language_enum" NOT NULL DEFAULT 'en',
        "is_taxable" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug"),
        CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "group" character varying NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code"),
        CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "isSuperAdmin" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "roleId" character varying NOT NULL,
        "permissionId" character varying NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "UQ_d430a02aad006d8a70f3acd7d03" UNIQUE ("roleId", "permissionId"),
        CONSTRAINT "PK_d430a02aad006d8a70f3acd7d03" PRIMARY KEY ("roleId", "permissionId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tenant_users" (
        "tenantId" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "roleId" character varying,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "UQ_8fa3e63dcfe2fe25531f8849e45" UNIQUE ("tenantId", "userId"),
        CONSTRAINT "PK_8fa3e63dcfe2fe25531f8849e45" PRIMARY KEY ("tenantId", "userId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "taxes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying,
        "name" character varying NOT NULL,
        "type" "public"."taxes_type_enum" NOT NULL DEFAULT 'PERCENTAGE',
        "rate" numeric(10,4),
        "amount" numeric(12,2),
        "status" "public"."taxes_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "UQ_taxes_code" UNIQUE ("code"),
        CONSTRAINT "PK_taxes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tenant_taxes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "taxId" uuid NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "UQ_tenant_taxes_tenant_tax" UNIQUE ("tenantId", "taxId"),
        CONSTRAINT "PK_tenant_taxes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tenant_themes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "presetId" varchar(255) NOT NULL,
        "logoUrl" varchar(500),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "deletedBy" uuid,
        CONSTRAINT "UQ_tenant_themes_tenantId" UNIQUE ("tenantId"),
        CONSTRAINT "PK_tenant_themes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entityName" character varying NOT NULL,
        "entityId" character varying NOT NULL,
        "action" character varying NOT NULL,
        "performedBy" uuid,
        "previousValues" jsonb,
        "newValues" jsonb,
        "timestamp" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_c954ae3b1156e075ccd4e9ce3e6" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" ADD CONSTRAINT "FK_tenant_taxes_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" ADD CONSTRAINT "FK_tenant_taxes_taxId" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_themes" ADD CONSTRAINT "FK_tenant_themes_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_themes" DROP CONSTRAINT "FK_tenant_themes_tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "FK_tenant_taxes_taxId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_taxes" DROP CONSTRAINT "FK_tenant_taxes_tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_c954ae3b1156e075ccd4e9ce3e6"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "tenant_themes"`);
    await queryRunner.query(`DROP TABLE "tenant_taxes"`);
    await queryRunner.query(`DROP TABLE "taxes"`);
    await queryRunner.query(`DROP TABLE "tenant_users"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."taxes_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."taxes_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_language_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
  }
}
