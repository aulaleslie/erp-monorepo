import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainerAvailabilityOverrides1769333753767 implements MigrationInterface {
  name = 'CreateTrainerAvailabilityOverrides1769333753767';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."trainer_availability_override_type_enum" AS ENUM('BLOCKED', 'MODIFIED')`,
    );

    await queryRunner.query(
      `CREATE TABLE "trainer_availability_overrides" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "trainerId" uuid NOT NULL,
        "date" date NOT NULL,
        "overrideType" "public"."trainer_availability_override_type_enum" NOT NULL,
        "startTime" TIME,
        "endTime" TIME,
        "reason" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        CONSTRAINT "PK_trainer_availability_overrides_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_trainer_availability_override" UNIQUE ("tenantId", "trainerId", "date", "overrideType", "startTime"),
        CONSTRAINT "FK_trainer_availability_overrides_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_trainer_availability_overrides_trainer" FOREIGN KEY ("trainerId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "trainer_availability_overrides"`);
    await queryRunner.query(
      `DROP TYPE "public"."trainer_availability_override_type_enum"`,
    );
  }
}
