import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateScheduleBookingsTable1769424000000 implements MigrationInterface {
  name = 'CreateScheduleBookingsTable1769424000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('schedule_bookings');
    if (tableExists) {
      return;
    }
    await queryRunner.query(
      `CREATE TYPE "public"."schedule_bookings_booking_type_enum" AS ENUM('PT_SESSION', 'GROUP_SESSION')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."schedule_bookings_status_enum" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')`,
    );
    await queryRunner.query(
      `CREATE TABLE "schedule_bookings" (
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "bookingType" "public"."schedule_bookings_booking_type_enum" NOT NULL,
        "memberId" uuid NOT NULL,
        "trainerId" uuid NOT NULL,
        "ptPackageId" uuid,
        "groupSessionId" uuid,
        "bookingDate" date NOT NULL,
        "startTime" time NOT NULL,
        "endTime" time NOT NULL,
        "durationMinutes" integer NOT NULL,
        "status" "public"."schedule_bookings_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "notes" text,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "cancelledAt" TIMESTAMP WITH TIME ZONE,
        "cancelledReason" text,
        CONSTRAINT "PK_schedule_bookings_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_bookings" ADD CONSTRAINT "FK_schedule_bookings_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_bookings" ADD CONSTRAINT "FK_schedule_bookings_member" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_bookings" ADD CONSTRAINT "FK_schedule_bookings_trainer" FOREIGN KEY ("trainerId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_bookings" ADD CONSTRAINT "FK_schedule_bookings_pt_package" FOREIGN KEY ("ptPackageId") REFERENCES "pt_session_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schedule_bookings" DROP CONSTRAINT "FK_schedule_bookings_pt_package"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_bookings" DROP CONSTRAINT "FK_schedule_bookings_trainer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_bookings" DROP CONSTRAINT "FK_schedule_bookings_member"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_bookings" DROP CONSTRAINT "FK_schedule_bookings_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "schedule_bookings"`);
    await queryRunner.query(
      `DROP TYPE "public"."schedule_bookings_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."schedule_bookings_booking_type_enum"`,
    );
  }
}
