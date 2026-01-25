import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMembersTable1769315505000 implements MigrationInterface {
  name = 'CreateMembersTable1769315505000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create member_status enum
    await queryRunner.query(
      `CREATE TYPE "public"."members_status_enum" AS ENUM('NEW', 'ACTIVE', 'EXPIRED', 'INACTIVE')`,
    );

    // Create members table
    await queryRunner.query(
      `CREATE TABLE "members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "personId" uuid NOT NULL,
        "memberCode" character varying NOT NULL,
        "status" "public"."members_status_enum" NOT NULL DEFAULT 'NEW',
        "memberSince" TIMESTAMP WITH TIME ZONE,
        "currentExpiryDate" TIMESTAMP WITH TIME ZONE,
        "profileCompletionPercent" integer NOT NULL DEFAULT 0,
        "agreesToTerms" boolean NOT NULL DEFAULT false,
        "termsAgreedAt" TIMESTAMP WITH TIME ZONE,
        "notes" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        CONSTRAINT "PK_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_members_tenant_person" UNIQUE ("tenantId", "personId"),
        CONSTRAINT "UQ_members_tenant_code" UNIQUE ("tenantId", "memberCode"),
        CONSTRAINT "FK_members_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_members_person" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )`,
    );

    // Indices for search performance (from requirements C6A-BE-01/02)
    await queryRunner.query(
      `CREATE INDEX "IDX_members_tenant_status" ON "members" ("tenantId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_members_tenant_status"`);
    await queryRunner.query(`DROP TABLE "members"`);
    await queryRunner.query(`DROP TYPE "public"."members_status_enum"`);
  }
}
