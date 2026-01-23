import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentRelationsTable1769041000000 implements MigrationInterface {
  name = 'CreateDocumentRelationsTable1769041000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."document_relations_relation_type_enum" AS ENUM('ORDER_TO_INVOICE', 'INVOICE_TO_CREDIT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_relations" (
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "fromDocumentId" uuid NOT NULL,
        "toDocumentId" uuid NOT NULL,
        "relationType" "public"."document_relations_relation_type_enum" NOT NULL,
        CONSTRAINT "PK_document_relations_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_relations" ADD CONSTRAINT "FK_document_relations_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_relations" ADD CONSTRAINT "FK_document_relations_from" FOREIGN KEY ("fromDocumentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_relations" ADD CONSTRAINT "FK_document_relations_to" FOREIGN KEY ("toDocumentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_relations" DROP CONSTRAINT "FK_document_relations_to"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_relations" DROP CONSTRAINT "FK_document_relations_from"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_relations" DROP CONSTRAINT "FK_document_relations_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "document_relations"`);
    await queryRunner.query(
      `DROP TYPE "public"."document_relations_relation_type_enum"`,
    );
  }
}
