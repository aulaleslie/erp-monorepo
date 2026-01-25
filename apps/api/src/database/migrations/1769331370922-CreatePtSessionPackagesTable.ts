import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePtSessionPackagesTable1769331370922 implements MigrationInterface {
  name = 'CreatePtSessionPackagesTable1769331370922';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."pt_session_packages_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'EXHAUSTED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pt_session_packages" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "memberId" uuid NOT NULL, "itemId" uuid NOT NULL, "itemName" character varying NOT NULL, "sourceDocumentId" uuid, "sourceDocumentItemId" uuid, "sourceMembershipId" uuid, "preferredTrainerId" uuid, "status" "public"."pt_session_packages_status_enum" NOT NULL DEFAULT 'ACTIVE', "totalSessions" integer NOT NULL, "usedSessions" integer NOT NULL DEFAULT '0', "remainingSessions" integer NOT NULL, "startDate" date NOT NULL, "expiryDate" date, "pricePaid" numeric(12,2) NOT NULL, "notes" text, "requiresReview" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_b5aa8b0c9a3f88bb00205576572" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" ADD CONSTRAINT "FK_0ef46d5c8b6b625442e2d9251e1" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" ADD CONSTRAINT "FK_b20e77b881c308f591e418c16ab" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" ADD CONSTRAINT "FK_546ffc8e1cf182b9ce0e2e50326" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" ADD CONSTRAINT "FK_ad74202815bd17530166c1cd560" FOREIGN KEY ("sourceDocumentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" ADD CONSTRAINT "FK_19472b63a79d0fe013b2e6115ca" FOREIGN KEY ("sourceDocumentItemId") REFERENCES "document_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" ADD CONSTRAINT "FK_3b7a8f17cfc285681bce8914dd2" FOREIGN KEY ("sourceMembershipId") REFERENCES "memberships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" ADD CONSTRAINT "FK_17756380110d14607c2244c6a12" FOREIGN KEY ("preferredTrainerId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" DROP CONSTRAINT "FK_17756380110d14607c2244c6a12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" DROP CONSTRAINT "FK_3b7a8f17cfc285681bce8914dd2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" DROP CONSTRAINT "FK_19472b63a79d0fe013b2e6115ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" DROP CONSTRAINT "FK_ad74202815bd17530166c1cd560"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" DROP CONSTRAINT "FK_546ffc8e1cf182b9ce0e2e50326"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" DROP CONSTRAINT "FK_b20e77b881c308f591e418c16ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pt_session_packages" DROP CONSTRAINT "FK_0ef46d5c8b6b625442e2d9251e1"`,
    );
    await queryRunner.query(`DROP TABLE "pt_session_packages"`);
    await queryRunner.query(
      `DROP TYPE "public"."pt_session_packages_status_enum"`,
    );
  }
}
