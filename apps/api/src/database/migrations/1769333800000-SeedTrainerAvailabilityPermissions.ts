import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTrainerAvailabilityPermissions1769333800000 implements MigrationInterface {
  name = 'SeedTrainerAvailabilityPermissions1769333800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "name", "group")
      VALUES 
        ('trainer_availability.read', 'Read Trainer Availability', 'Scheduling'),
        ('trainer_availability.update', 'Update Trainer Availability', 'Scheduling')
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permissions" 
      WHERE "code" IN ('trainer_availability.read', 'trainer_availability.update')
    `);
  }
}
