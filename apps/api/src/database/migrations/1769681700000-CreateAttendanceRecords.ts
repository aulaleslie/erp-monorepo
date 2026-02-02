import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendanceRecords1769681700000 implements MigrationInterface {
  name = 'CreateAttendanceRecords1769681700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_records_attendancetype_enum" AS ENUM('GYM_ENTRY', 'PT_SESSION', 'GROUP_CLASS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_records_checkinmethod_enum" AS ENUM('MANUAL', 'QR_CODE', 'MEMBER_CODE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attendance_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "memberId" uuid NOT NULL,
        "attendanceType" "public"."attendance_records_attendancetype_enum" NOT NULL,
        "bookingId" uuid,
        "checkInAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "checkOutAt" TIMESTAMP WITH TIME ZONE,
        "checkInMethod" "public"."attendance_records_checkinmethod_enum" NOT NULL,
        "checkedInByUserId" uuid,
        "notes" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        CONSTRAINT "PK_attendance_records" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "FK_attendance_records_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "FK_attendance_records_member" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "FK_attendance_records_booking" FOREIGN KEY ("bookingId") REFERENCES "schedule_bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "FK_attendance_records_checked_in_by" FOREIGN KEY ("checkedInByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_attendance_records_checked_in_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_attendance_records_booking"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_attendance_records_member"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_attendance_records_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "attendance_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."attendance_records_checkinmethod_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."attendance_records_attendancetype_enum"`,
    );
  }
}
