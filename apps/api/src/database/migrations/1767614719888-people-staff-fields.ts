import { MigrationInterface, QueryRunner } from 'typeorm';

export class PeopleStaffFields1767614719888 implements MigrationInterface {
  name = 'PeopleStaffFields1767614719888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "people" ADD "department" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "people" ADD "userId" uuid`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_people_staff_user" ON "people" ("userId") WHERE "userId" IS NOT NULL AND "type" = 'STAFF'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_people_tenant_user" ON "people" ("tenantId", "userId") WHERE "userId" IS NOT NULL`,
    );
    const usersTable = await queryRunner.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS "exists"`,
    );

    if (usersTable[0]?.exists) {
      await queryRunner.query(
        `ALTER TABLE "people" ADD CONSTRAINT "FK_people_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "people" DROP CONSTRAINT IF EXISTS "FK_people_userId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_people_tenant_user"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_people_staff_user"`);
    await queryRunner.query(`ALTER TABLE "people" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "people" DROP COLUMN "department"`);
  }
}
