import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRolePermissionsForSuperAdminRoles1769800000000 implements MigrationInterface {
  name = 'RemoveRolePermissionsForSuperAdminRoles1769800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove role_permissions entries for roles marked as tenant super admin
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "roles" r
      WHERE rp."roleId" = r.id
        AND r."isSuperAdmin" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-insert role_permissions entries for tenant super admin roles (idempotent)
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("roleId", "permissionId")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r."isSuperAdmin" = true
      ON CONFLICT ("roleId", "permissionId") DO NOTHING
    `);
  }
}
