import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMembershipsNotificationsPermissions1769740000000 implements MigrationInterface {
  name = 'SeedMembershipsNotificationsPermissions1769740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "name", "group")
      VALUES
        ('memberships.read', 'Read Memberships', 'Memberships'),
        ('memberships.create', 'Create Memberships', 'Memberships'),
        ('memberships.update', 'Update Memberships', 'Memberships'),
        ('memberships.cancel', 'Cancel Memberships', 'Memberships'),
        ('notifications.read', 'Read Notifications', 'Notifications')
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "group" = EXCLUDED."group"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN (
        'memberships.read',
        'memberships.create',
        'memberships.update',
        'memberships.cancel',
        'notifications.read'
      )
    `);
  }
}
