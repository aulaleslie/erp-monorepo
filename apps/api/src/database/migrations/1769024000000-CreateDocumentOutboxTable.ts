import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentOutboxTable1769024000000 implements MigrationInterface {
  name = 'CreateDocumentOutboxTable1769024000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."document_outbox_status_enum" AS ENUM('PENDING', 'PROCESSING', 'DONE', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_outbox" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "documentId" uuid NOT NULL,
        "eventKey" character varying NOT NULL,
        "eventVersion" integer NOT NULL DEFAULT 1,
        "status" "public"."document_outbox_status_enum" NOT NULL DEFAULT 'PENDING',
        "attempts" integer NOT NULL DEFAULT 0,
        "nextAttemptAt" TIMESTAMP WITH TIME ZONE,
        "lastError" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        CONSTRAINT "UQ_document_outbox_idempotency" UNIQUE ("documentId", "eventKey", "eventVersion"),
        CONSTRAINT "PK_document_outbox_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_document_outbox_status_next_attempt" ON "document_outbox" ("status", "nextAttemptAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_outbox" ADD CONSTRAINT "FK_document_outbox_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_outbox" ADD CONSTRAINT "FK_document_outbox_documentId" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_outbox" DROP CONSTRAINT "FK_document_outbox_documentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_outbox" DROP CONSTRAINT "FK_document_outbox_tenantId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_document_outbox_status_next_attempt"`,
    );
    await queryRunner.query(`DROP TABLE "document_outbox"`);
    await queryRunner.query(`DROP TYPE "public"."document_outbox_status_enum"`);
  }
}
