import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagRulesToTenants1769030000000 implements MigrationInterface {
  name = 'AddTagRulesToTenants1769030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "tag_max_length" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "tag_allowed_pattern" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN "tag_allowed_pattern"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN "tag_max_length"`,
    );
  }
}
