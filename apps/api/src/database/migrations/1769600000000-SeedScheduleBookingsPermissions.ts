import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedScheduleBookingsPermissions1769600000000 implements MigrationInterface {
  name = 'SeedScheduleBookingsPermissions1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "name", "group")
      VALUES 
        ('schedules.read', 'Read Schedules', 'Scheduling'),
        ('schedules.create', 'Create Schedules', 'Scheduling'),
        ('schedules.update', 'Update Schedules', 'Scheduling'),
        ('schedules.delete', 'Delete Schedules', 'Scheduling')
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permissions" 
      WHERE "code" IN ('schedules.read', 'schedules.create', 'schedules.update', 'schedules.delete')
    `);
  }
}
