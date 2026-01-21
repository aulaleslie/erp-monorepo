import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentEngineTables1769015200273 implements MigrationInterface {
  name = 'CreateDocumentEngineTables1769015200273';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."chart_of_accounts_type_enum" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chart_of_accounts" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "type" "public"."chart_of_accounts_type_enum" NOT NULL, "parentId" uuid, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_chart_of_accounts_tenant_code" UNIQUE ("tenantId", "code"), CONSTRAINT "PK_467c08a2efc78393c647da32bac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cost_centers" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_cost_centers_tenant_code" UNIQUE ("tenantId", "code"), CONSTRAINT "PK_e70f55c677c255c1f81f0ed1ccb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_module_enum" AS ENUM('SALES', 'PURCHASE', 'ACCOUNTING', 'INVENTORY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'REVISION_REQUESTED', 'REJECTED', 'APPROVED', 'POSTED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_accessscope_enum" AS ENUM('TENANT', 'CREATOR', 'ROLE', 'USER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "documents" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "module" "public"."documents_module_enum" NOT NULL, "documentKey" character varying NOT NULL, "number" character varying NOT NULL, "status" "public"."documents_status_enum" NOT NULL DEFAULT 'DRAFT', "accessScope" "public"."documents_accessscope_enum" NOT NULL DEFAULT 'TENANT', "accessRoleId" uuid, "accessUserId" uuid, "documentDate" TIMESTAMP WITH TIME ZONE NOT NULL, "dueDate" TIMESTAMP WITH TIME ZONE, "postingDate" TIMESTAMP WITH TIME ZONE, "currencyCode" character varying NOT NULL DEFAULT 'IDR', "exchangeRate" numeric(12,6) NOT NULL DEFAULT '1', "personId" uuid, "personName" character varying, "subtotal" numeric(12,2) NOT NULL, "discountTotal" numeric(12,2) NOT NULL, "taxTotal" numeric(12,2) NOT NULL, "total" numeric(12,2) NOT NULL, "metadata" jsonb, "submittedAt" TIMESTAMP WITH TIME ZONE, "approvedAt" TIMESTAMP WITH TIME ZONE, "postedAt" TIMESTAMP WITH TIME ZONE, "cancelledAt" TIMESTAMP WITH TIME ZONE, "rejectedAt" TIMESTAMP WITH TIME ZONE, "revisionRequestedAt" TIMESTAMP WITH TIME ZONE, "notes" text, CONSTRAINT "UQ_documents_tenant_key_number" UNIQUE ("tenantId", "documentKey", "number"), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_documents_person_name" ON "documents" ("personName") `,
    );
    await queryRunner.query(
      `CREATE TABLE "document_items" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentId" uuid NOT NULL, "itemId" uuid NOT NULL, "itemName" character varying NOT NULL, "itemType" character varying NOT NULL, "description" text, "quantity" numeric(12,4) NOT NULL, "unitPrice" numeric(12,2) NOT NULL, "discountAmount" numeric(12,2) NOT NULL DEFAULT '0', "taxAmount" numeric(12,2) NOT NULL DEFAULT '0', "lineTotal" numeric(12,2) NOT NULL, "dimensions" jsonb, "metadata" jsonb, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_09473d260190ca635dbe2bc5a98" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_tax_lines" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "documentId" uuid NOT NULL, "documentItemId" uuid, "taxId" uuid, "taxName" character varying NOT NULL, "taxType" character varying NOT NULL, "taxRate" numeric(10,4), "taxAmount" numeric(12,2) NOT NULL, "taxableBase" numeric(12,2) NOT NULL, CONSTRAINT "PK_0d2a5fffe56433a338c0c7ee42a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_account_lines" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "documentId" uuid NOT NULL, "accountId" uuid NOT NULL, "description" text, "debitAmount" numeric(12,2) NOT NULL DEFAULT '0', "creditAmount" numeric(12,2) NOT NULL DEFAULT '0', "costCenterId" uuid, "metadata" jsonb, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "CHK_document_account_lines_debit_credit" CHECK (("debitAmount" > 0 AND "creditAmount" = 0) OR ("debitAmount" = 0 AND "creditAmount" > 0)), CONSTRAINT "PK_ebb3a3a62a712a722411a3e7dc4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_1d5ed6ca50597ce065aee835ac1" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "FK_696136b16d41cbf47ff3db72f75" FOREIGN KEY ("parentId") REFERENCES "chart_of_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_centers" ADD CONSTRAINT "FK_5fd0ca834cb330afc516de061ab" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_60f16e580e8deb01244205a4359" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_b628a633917e856718df9dbccc0" FOREIGN KEY ("accessRoleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_6df0b09a066263e5096484d3cb7" FOREIGN KEY ("accessUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_303be07b15d20ab10ab0c722007" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_items" ADD CONSTRAINT "FK_2e12be9e375d7d1c2730dd0c8fa" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_items" ADD CONSTRAINT "FK_09ee82af8d318d1dc65f0f9d3da" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_tax_lines" ADD CONSTRAINT "FK_0af1900744125ce983edacc4ab7" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_tax_lines" ADD CONSTRAINT "FK_ea8f142e574a47645d12e3a0598" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_tax_lines" ADD CONSTRAINT "FK_3c5f873eb2a46bdcff51981f4a0" FOREIGN KEY ("documentItemId") REFERENCES "document_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_tax_lines" ADD CONSTRAINT "FK_3a820c3f81955db30a59448eb65" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_account_lines" ADD CONSTRAINT "FK_cb4a59c6e9102bad38abfd8d852" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_account_lines" ADD CONSTRAINT "FK_fa2adc58f60ee40e4ffdae9203d" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_account_lines" ADD CONSTRAINT "FK_74b3e61ff8f1891006f5bb36613" FOREIGN KEY ("accountId") REFERENCES "chart_of_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_account_lines" ADD CONSTRAINT "FK_1b9d28a33f43c0702d5ec47ca03" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_account_lines" DROP CONSTRAINT "FK_1b9d28a33f43c0702d5ec47ca03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_account_lines" DROP CONSTRAINT "FK_74b3e61ff8f1891006f5bb36613"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_account_lines" DROP CONSTRAINT "FK_fa2adc58f60ee40e4ffdae9203d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_account_lines" DROP CONSTRAINT "FK_cb4a59c6e9102bad38abfd8d852"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_tax_lines" DROP CONSTRAINT "FK_3a820c3f81955db30a59448eb65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_tax_lines" DROP CONSTRAINT "FK_3c5f873eb2a46bdcff51981f4a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_tax_lines" DROP CONSTRAINT "FK_ea8f142e574a47645d12e3a0598"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_tax_lines" DROP CONSTRAINT "FK_0af1900744125ce983edacc4ab7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_items" DROP CONSTRAINT "FK_09ee82af8d318d1dc65f0f9d3da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_items" DROP CONSTRAINT "FK_2e12be9e375d7d1c2730dd0c8fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_303be07b15d20ab10ab0c722007"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_6df0b09a066263e5096484d3cb7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_b628a633917e856718df9dbccc0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_60f16e580e8deb01244205a4359"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_centers" DROP CONSTRAINT "FK_5fd0ca834cb330afc516de061ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT "FK_696136b16d41cbf47ff3db72f75"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chart_of_accounts" DROP CONSTRAINT "FK_1d5ed6ca50597ce065aee835ac1"`,
    );
    await queryRunner.query(`DROP TABLE "document_account_lines"`);
    await queryRunner.query(`DROP TABLE "document_tax_lines"`);
    await queryRunner.query(`DROP TABLE "document_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_documents_person_name"`);
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TYPE "public"."documents_accessscope_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."documents_module_enum"`);
    await queryRunner.query(`DROP TABLE "cost_centers"`);
    await queryRunner.query(`DROP TABLE "chart_of_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."chart_of_accounts_type_enum"`);
  }
}
