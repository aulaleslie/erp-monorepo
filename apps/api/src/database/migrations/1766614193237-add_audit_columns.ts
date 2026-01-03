import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditColumns1766614193237 implements MigrationInterface {
  name = 'AddAuditColumns1766614193237';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "createdBy" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD "updatedBy" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedBy" uuid`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "createdBy" uuid`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "updatedBy" uuid`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "deletedBy" uuid`);
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "permissions" ADD "createdBy" uuid`);
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "permissions" ADD "updatedBy" uuid`);
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "permissions" ADD "deletedBy" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "createdBy" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "updatedBy" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deletedBy" uuid`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD "createdBy" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD "updatedBy" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD "deletedBy" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "tenant_users" ADD "createdBy" uuid`);
    await queryRunner.query(
      `ALTER TABLE "tenant_users" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "tenant_users" ADD "updatedBy" uuid`);
    await queryRunner.query(
      `ALTER TABLE "tenant_users" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "tenant_users" ADD "deletedBy" uuid`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "UQ_d430a02aad006d8a70f3acd7d03" UNIQUE ("roleId", "permissionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" ADD CONSTRAINT "UQ_8fa3e63dcfe2fe25531f8849e45" UNIQUE ("tenantId", "userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP CONSTRAINT "UQ_8fa3e63dcfe2fe25531f8849e45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "UQ_d430a02aad006d8a70f3acd7d03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP COLUMN "deletedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP COLUMN "updatedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_users" DROP COLUMN "createdBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP COLUMN "deletedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP COLUMN "updatedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP COLUMN "createdBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deletedBy"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "createdBy"`);
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "deletedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "updatedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "createdBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "deletedBy"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "createdBy"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedBy"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedBy"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdBy"`);
  }
}
