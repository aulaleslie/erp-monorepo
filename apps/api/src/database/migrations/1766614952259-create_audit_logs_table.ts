import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1766614952259 implements MigrationInterface {
  name = 'CreateAuditLogsTable1766614952259';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entityName" character varying NOT NULL, "entityId" character varying NOT NULL, "action" character varying NOT NULL, "performedBy" uuid, "previousValues" jsonb, "newValues" jsonb, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
