import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalesApprovalEntities1769245176690 implements MigrationInterface {
  name = 'AddSalesApprovalEntities1769245176690';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Sales Approval Levels
    await queryRunner.query(
      `CREATE TABLE "sales_approval_levels" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "documentKey" character varying NOT NULL, "levelIndex" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_9421da703e607c21ba5504ce3fe" PRIMARY KEY ("id"))`,
    );

    // Create Sales Approval Level Roles (Join Table)
    await queryRunner.query(
      `CREATE TABLE "sales_approval_level_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "salesApprovalLevelId" uuid NOT NULL, "roleId" uuid NOT NULL, CONSTRAINT "PK_553c48179d4752ad05757cba577" PRIMARY KEY ("id"))`,
    );

    // Create Sales Approvals status enum
    await queryRunner.query(
      `CREATE TYPE "public"."sales_approvals_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED')`,
    );

    // Create Sales Approvals
    await queryRunner.query(
      `CREATE TABLE "sales_approvals" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "deletedAt" TIMESTAMP WITH TIME ZONE, "deletedBy" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentId" uuid NOT NULL, "levelIndex" integer NOT NULL, "status" "public"."sales_approvals_status_enum" NOT NULL DEFAULT 'PENDING', "requestedByUserId" uuid, "decidedByUserId" uuid, "decidedAt" TIMESTAMP WITH TIME ZONE, "notes" text, CONSTRAINT "PK_9f302532c7c0faac95278e2c06f" PRIMARY KEY ("id"))`,
    );

    // Foreign keys for sales_approval_levels
    await queryRunner.query(
      `ALTER TABLE "sales_approval_levels" ADD CONSTRAINT "FK_d455ec7a1abf1fdff0ec122dae1" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Foreign keys for sales_approval_level_roles
    await queryRunner.query(
      `ALTER TABLE "sales_approval_level_roles" ADD CONSTRAINT "FK_e29affae6d30317e708228a0cc4" FOREIGN KEY ("salesApprovalLevelId") REFERENCES "sales_approval_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_approval_level_roles" ADD CONSTRAINT "FK_a7a21950bfde51b1758124bf2f7" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Foreign keys for sales_approvals
    await queryRunner.query(
      `ALTER TABLE "sales_approvals" ADD CONSTRAINT "FK_7dcf3aab185d4342b0368c851aa" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_approvals" ADD CONSTRAINT "FK_913bb4c22bdd646eaea8eee013d" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_approvals" ADD CONSTRAINT "FK_c7f8087d573a577b267b2ad7390" FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_approvals" DROP CONSTRAINT "FK_c7f8087d573a577b267b2ad7390"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_approvals" DROP CONSTRAINT "FK_913bb4c22bdd646eaea8eee013d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_approvals" DROP CONSTRAINT "FK_7dcf3aab185d4342b0368c851aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_approval_level_roles" DROP CONSTRAINT "FK_a7a21950bfde51b1758124bf2f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_approval_level_roles" DROP CONSTRAINT "FK_e29affae6d30317e708228a0cc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_approval_levels" DROP CONSTRAINT "FK_d455ec7a1abf1fdff0ec122dae1"`,
    );
    await queryRunner.query(`DROP TABLE "sales_approvals"`);
    await queryRunner.query(`DROP TYPE "public"."sales_approvals_status_enum"`);
    await queryRunner.query(`DROP TABLE "sales_approval_level_roles"`);
    await queryRunner.query(`DROP TABLE "sales_approval_levels"`);
  }
}
