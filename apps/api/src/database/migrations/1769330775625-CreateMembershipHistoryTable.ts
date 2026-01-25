import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMembershipHistoryTable1769330775625 implements MigrationInterface {
  name = 'CreateMembershipHistoryTable1769330775625';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."membership_history_action_enum" AS ENUM('CREATED', 'EXTENDED', 'CANCELLED', 'EXPIRED', 'FLAGGED', 'CLEARED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_history_fromstatus_enum" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_history_tostatus_enum" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(`CREATE TABLE "membership_history" (
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "createdBy" uuid,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updatedBy" uuid,
      "deletedAt" TIMESTAMP WITH TIME ZONE,
      "deletedBy" uuid,
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "membershipId" uuid NOT NULL,
      "action" "public"."membership_history_action_enum" NOT NULL,
      "fromStatus" "public"."membership_history_fromstatus_enum",
      "toStatus" "public"."membership_history_tostatus_enum",
      "notes" text,
      "performedByUserId" uuid,
      "performedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_2be1074a461a1126edc0a0cde6d" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `ALTER TABLE "membership_history" ADD CONSTRAINT "FK_20166dd31506ab08dce65ec23b5" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_history" ADD CONSTRAINT "FK_0ec7d6dff45b52b9c427d6df8a0" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "membership_history" DROP CONSTRAINT "FK_0ec7d6dff45b52b9c427d6df8a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_history" DROP CONSTRAINT "FK_20166dd31506ab08dce65ec23b5"`,
    );
    await queryRunner.query(`DROP TABLE "membership_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."membership_history_tostatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."membership_history_fromstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."membership_history_action_enum"`,
    );
  }
}
