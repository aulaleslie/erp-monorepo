import { MigrationInterface, QueryRunner } from 'typeorm';

export class PeopleDepartmentFk1768100100000 implements MigrationInterface {
  name = 'PeopleDepartmentFk1768100100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add departmentId column
    await queryRunner.query(`ALTER TABLE "people" ADD "departmentId" uuid`);

    // Migrate existing department string values to departmentId
    await queryRunner.query(`
      UPDATE "people"
      SET "departmentId" = "departments"."id"
      FROM "departments"
      WHERE "people"."department" = "departments"."name"
      AND "people"."tenantId" = "departments"."tenantId"
    `);

    // Drop the old department string column
    await queryRunner.query(`ALTER TABLE "people" DROP COLUMN "department"`);

    // Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "people" ADD CONSTRAINT "FK_people_departmentId" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(
      `ALTER TABLE "people" DROP CONSTRAINT "FK_people_departmentId"`,
    );

    // Re-add department string column
    await queryRunner.query(
      `ALTER TABLE "people" ADD "department" character varying`,
    );

    // Restore department string values from departmentId
    await queryRunner.query(`
      UPDATE "people"
      SET "department" = "departments"."name"
      FROM "departments"
      WHERE "people"."departmentId" = "departments"."id"
    `);

    // Drop departmentId column
    await queryRunner.query(`ALTER TABLE "people" DROP COLUMN "departmentId"`);
  }
}
