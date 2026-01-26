import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantSchedulingSettings1769422843483 implements MigrationInterface {
  name = 'AddTenantSchedulingSettings1769422843483';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "tenant_scheduling_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "slot_duration_minutes" integer NOT NULL DEFAULT '60',
                "booking_lead_time_hours" integer NOT NULL DEFAULT '0',
                "cancellation_window_hours" integer NOT NULL DEFAULT '24',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" uuid,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedBy" uuid,
                "deletedAt" TIMESTAMP WITH TIME ZONE,
                "deletedBy" uuid,
                CONSTRAINT "PK_tenant_scheduling_settings" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_tenant_scheduling_settings_tenant" UNIQUE ("tenantId"),
                CONSTRAINT "FK_tenant_scheduling_settings_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenant_scheduling_settings"`);
  }
}
