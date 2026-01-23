import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesHeadersTable1769040000000 implements MigrationInterface {
  name = 'CreateSalesHeadersTable1769040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sales_tax_pricing_mode_enum" AS ENUM('INCLUSIVE', 'EXCLUSIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sales_headers" (
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "createdBy" uuid, 
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "updatedBy" uuid, 
        "deletedAt" TIMESTAMP WITH TIME ZONE, 
        "deletedBy" uuid, 
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "tenantId" uuid NOT NULL, 
        "documentId" uuid NOT NULL, 
        "salespersonPersonId" uuid, 
        "externalRef" character varying, 
        "paymentTerms" character varying, 
        "deliveryDate" TIMESTAMP WITH TIME ZONE, 
        "taxPricingMode" "public"."sales_tax_pricing_mode_enum" NOT NULL, 
        "billingAddressSnapshot" text, 
        "shippingAddressSnapshot" text, 
        CONSTRAINT "REL_sales_headers_document" UNIQUE ("documentId"), 
        CONSTRAINT "PK_sales_headers_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_headers" ADD CONSTRAINT "FK_sales_headers_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_headers" ADD CONSTRAINT "FK_sales_headers_document" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_headers" ADD CONSTRAINT "FK_sales_headers_salesperson" FOREIGN KEY ("salespersonPersonId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_headers" DROP CONSTRAINT "FK_sales_headers_salesperson"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_headers" DROP CONSTRAINT "FK_sales_headers_document"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_headers" DROP CONSTRAINT "FK_sales_headers_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "sales_headers"`);
    await queryRunner.query(`DROP TYPE "public"."sales_tax_pricing_mode_enum"`);
  }
}
