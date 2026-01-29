import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAttendancePermissions1769640000000 implements MigrationInterface {
  name = 'SeedAttendancePermissions1769640000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "name", "group")
      VALUES 
        ('attendance.read', 'Read Attendance Records', 'Attendance'),
        ('attendance.create', 'Create Attendance Records', 'Attendance')
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "group" = EXCLUDED."group"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permissions" 
      WHERE "code" IN (
        'attendance.read', 
        'attendance.create'
      )
    `);
  }
}
