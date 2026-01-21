import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentWorkflowTables1769018000000 implements MigrationInterface {
  name = 'CreateDocumentWorkflowTables1769018000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."document_approvals_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_approvals" (
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "createdBy" uuid, 
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "updatedBy" uuid, 
        "deletedAt" TIMESTAMP WITH TIME ZONE, 
        "deletedBy" uuid, 
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "documentId" uuid NOT NULL, 
        "stepIndex" integer NOT NULL DEFAULT '0', 
        "status" "public"."document_approvals_status_enum" NOT NULL DEFAULT 'PENDING', 
        "requestedByUserId" uuid NOT NULL, 
        "decidedByUserId" uuid, 
        "notes" text, 
        "decidedAt" TIMESTAMP WITH TIME ZONE, 
        CONSTRAINT "PK_document_approvals" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_document_approvals_document_step" ON "document_approvals" ("documentId", "stepIndex")`,
    );
    await queryRunner.query(
      `CREATE TABLE "document_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "documentId" uuid NOT NULL, 
        "fromStatus" "public"."documents_status_enum" NOT NULL, 
        "toStatus" "public"."documents_status_enum" NOT NULL, 
        "changedByUserId" uuid NOT NULL, 
        "reason" text, 
        "changedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        CONSTRAINT "PK_document_status_history" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_approvals" ADD CONSTRAINT "FK_document_approvals_document" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_approvals" ADD CONSTRAINT "FK_document_approvals_requested_by" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_approvals" ADD CONSTRAINT "FK_document_approvals_decided_by" FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_status_history" ADD CONSTRAINT "FK_document_status_history_document" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_status_history" ADD CONSTRAINT "FK_document_status_history_changed_by" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_status_history" DROP CONSTRAINT "FK_document_status_history_changed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_status_history" DROP CONSTRAINT "FK_document_status_history_document"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_approvals" DROP CONSTRAINT "FK_document_approvals_decided_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_approvals" DROP CONSTRAINT "FK_document_approvals_requested_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_approvals" DROP CONSTRAINT "FK_document_approvals_document"`,
    );
    await queryRunner.query(`DROP TABLE "document_status_history"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_document_approvals_document_step"`,
    );
    await queryRunner.query(`DROP TABLE "document_approvals"`);
    await queryRunner.query(
      `DROP TYPE "public"."document_approvals_status_enum"`,
    );
  }
}
