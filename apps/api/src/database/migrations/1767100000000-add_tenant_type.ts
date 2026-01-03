import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantType1767100000000 implements MigrationInterface {
  name = 'AddTenantType1767100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "tenants_type_enum" AS ENUM ('GYM', 'EATERY', 'COMPUTER_STORE', 'GROCERY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "type" "tenants_type_enum" NOT NULL DEFAULT 'GYM'`,
    );
    await queryRunner.query(
      `UPDATE "tenants" SET "type" = 'EATERY' WHERE "is_eatery" = true`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "is_eatery"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "is_eatery" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "tenants" SET "is_eatery" = true WHERE "type" = 'EATERY'`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "tenants_type_enum"`);
  }
}
