import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainerAvailability1769333336382 implements MigrationInterface {
  name = 'CreateTrainerAvailability1769333336382';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "trainer_availability" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "trainerId" uuid NOT NULL,
        "dayOfWeek" integer NOT NULL,
        "startTime" TIME NOT NULL,
        "endTime" TIME NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        CONSTRAINT "PK_trainer_availability_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_trainer_availability_slot" UNIQUE ("tenantId", "trainerId", "dayOfWeek", "startTime"),
        CONSTRAINT "CHK_trainer_availability_times" CHECK ("startTime" < "endTime"),
        CONSTRAINT "FK_trainer_availability_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_trainer_availability_trainer" FOREIGN KEY ("trainerId") REFERENCES "people"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "trainer_availability"`);
  }
}
