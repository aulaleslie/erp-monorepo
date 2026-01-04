import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantLanguage1767300000000 implements MigrationInterface {
  name = 'AddTenantLanguage1767300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tenants_language_enum" AS ENUM('en', 'id')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "language" "public"."tenants_language_enum" NOT NULL DEFAULT 'en'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "language"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_language_enum"`);
  }
}
