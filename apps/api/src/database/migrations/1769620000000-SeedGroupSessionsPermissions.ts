import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedGroupSessionsPermissions1769620000000 implements MigrationInterface {
  name = 'SeedGroupSessionsPermissions1769620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "name", "group")
      VALUES 
        ('group_sessions.read', 'Read Group Sessions', 'Group Sessions'),
        ('group_sessions.create', 'Create Group Sessions', 'Group Sessions'),
        ('group_sessions.update', 'Update Group Sessions', 'Group Sessions'),
        ('group_sessions.delete', 'Delete Group Sessions', 'Group Sessions'),
        ('group_sessions.cancel', 'Cancel Group Sessions', 'Group Sessions'),
        ('group_sessions.participants.manage', 'Manage Group Session Participants', 'Group Sessions')
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "group" = EXCLUDED."group"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "permissions" 
      WHERE "code" IN (
        'group_sessions.read', 
        'group_sessions.create', 
        'group_sessions.update', 
        'group_sessions.delete',
        'group_sessions.cancel',
        'group_sessions.participants.manage'
      )
    `);
  }
}
