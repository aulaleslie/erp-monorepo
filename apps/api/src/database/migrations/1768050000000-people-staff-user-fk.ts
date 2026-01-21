import { MigrationInterface, QueryRunner } from 'typeorm';

export class PeopleStaffUserFk1768050000000 implements MigrationInterface {
  name = 'PeopleStaffUserFk1768050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS "exists"`,
    );

    const fkConstraint = await queryRunner.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'people'
          AND constraint_name = 'FK_people_userId'
      ) AS "exists"`,
    );

    if (usersTable[0]?.exists && !fkConstraint[0]?.exists) {
      await queryRunner.query(
        `ALTER TABLE "people" ADD CONSTRAINT "FK_people_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "people" DROP CONSTRAINT IF EXISTS "FK_people_userId"`,
    );
  }
}
