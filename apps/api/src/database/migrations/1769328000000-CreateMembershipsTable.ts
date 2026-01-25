import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMembershipsTable1769328000000 implements MigrationInterface {
  name = 'CreateMembershipsTable1769328000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."memberships_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED')`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."memberships_durationunit_enum" AS ENUM('DAY', 'WEEK', 'MONTH', 'YEAR')`,
    );

    await queryRunner.query(
      `CREATE TABLE "memberships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "memberId" uuid NOT NULL,
        "itemId" uuid NOT NULL,
        "itemName" character varying NOT NULL,
        "sourceDocumentId" uuid,
        "sourceDocumentItemId" uuid,
        "status" "public"."memberships_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "durationValue" integer NOT NULL,
        "durationUnit" "public"."memberships_durationunit_enum" NOT NULL,
        "pricePaid" numeric(12,2) NOT NULL,
        "notes" text,
        "cancelledAt" TIMESTAMP WITH TIME ZONE,
        "cancelledReason" text,
        "requiresReview" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        CONSTRAINT "PK_memberships_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_memberships_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_memberships_member" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_memberships_item" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_memberships_document" FOREIGN KEY ("sourceDocumentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_memberships_document_item" FOREIGN KEY ("sourceDocumentItemId") REFERENCES "document_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )`,
    );

    // Index for common queries
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_tenant_member" ON "memberships" ("tenantId", "memberId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_tenant_status" ON "memberships" ("tenantId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_memberships_tenant_status"`);
    await queryRunner.query(`DROP INDEX "IDX_memberships_tenant_member"`);
    await queryRunner.query(`DROP TABLE "memberships"`);
    await queryRunner.query(
      `DROP TYPE "public"."memberships_durationunit_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."memberships_status_enum"`);
  }
}
