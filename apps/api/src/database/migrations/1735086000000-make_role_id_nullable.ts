import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeRoleIdNullable1735086000000 implements MigrationInterface {
  name = 'MakeRoleIdNullable1735086000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make roleId column nullable to support users without assigned roles
    await queryRunner.query(`
      ALTER TABLE "tenant_users" 
      ALTER COLUMN "roleId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Make roleId column NOT NULL (may fail if there are null values)
    await queryRunner.query(`
      ALTER TABLE "tenant_users" 
      ALTER COLUMN "roleId" SET NOT NULL
    `);
  }
}

