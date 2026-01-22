import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagIsActive1769031000000 implements MigrationInterface {
  name = 'AddTagIsActive1769031000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tags" ADD "isActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ALTER COLUMN "isActive" SET DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "isActive"`);
  }
}
