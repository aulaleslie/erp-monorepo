import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaxesTable1767000000001 implements MigrationInterface {
  name = 'CreateTaxesTable1767000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Enums
    await queryRunner.query(
      `CREATE TYPE "taxes_type_enum" AS ENUM ('PERCENTAGE', 'FIXED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "taxes_status_enum" AS ENUM ('ACTIVE', 'INACTIVE')`,
    );

    // Create Table
    await queryRunner.query(`
            CREATE TABLE "taxes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying,
                "name" character varying NOT NULL,
                "type" "taxes_type_enum" NOT NULL DEFAULT 'PERCENTAGE',
                "rate" numeric(10,4),
                "amount" numeric(12,2),
                "status" "taxes_status_enum" NOT NULL DEFAULT 'ACTIVE',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "createdBy" uuid,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedBy" uuid,
                "deletedAt" TIMESTAMP,
                "deletedBy" uuid,
                CONSTRAINT "UQ_taxes_code" UNIQUE ("code"),
                CONSTRAINT "PK_taxes_id" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "taxes"`);
    await queryRunner.query(`DROP TYPE "taxes_status_enum"`);
    await queryRunner.query(`DROP TYPE "taxes_type_enum"`);
  }
}
