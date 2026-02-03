import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssignPermissionsToSuperAdminRoles1769745000000000 implements MigrationInterface {
  name = 'AssignPermissionsToSuperAdminRoles1769745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Assign all permissions to any role marked as tenant super admin
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("roleId", "permissionId")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r."isSuperAdmin" = true
      ON CONFLICT ("roleId", "permissionId") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role_permissions entries that link tenant super admin roles to permissions
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "roles" r, "permissions" p
      WHERE rp."roleId" = r.id
        AND rp."permissionId" = p.id
        AND r."isSuperAdmin" = true
    `);
  }
}
