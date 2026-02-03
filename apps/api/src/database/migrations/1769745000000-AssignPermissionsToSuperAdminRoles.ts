import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssignPermissionsToSuperAdminRoles1769745000000000 implements MigrationInterface {
  name = 'AssignPermissionsToSuperAdminRoles1769745000000000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Deprecated migration: assignment of all permissions to tenant super admin roles
    // is now handled dynamically in the application (`getPermissions`) and a
    // cleanup migration was added to remove existing `role_permissions` links.
    // This migration is intentionally a no-op to avoid re-applying assignments.
    return Promise.resolve();
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op (cleanup handled by dedicated migration)
    return Promise.resolve();
  }
}
