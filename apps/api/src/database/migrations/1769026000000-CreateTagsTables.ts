import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTagsTables1769026000000 implements MigrationInterface {
  name = 'CreateTagsTables1769026000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create tags table
    await queryRunner.query(
      `CREATE TABLE "tags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "nameNormalized" character varying NOT NULL,
        "usageCount" integer NOT NULL DEFAULT 0,
        "lastUsedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        CONSTRAINT "PK_tags_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tags_tenant_name_normalized" UNIQUE ("tenantId", "nameNormalized")
      )`,
    );

    // 2. Create tag_links table
    await queryRunner.query(
      `CREATE TABLE "tag_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "tagId" uuid NOT NULL,
        "resourceType" character varying NOT NULL,
        "resourceId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "deletedBy" uuid,
        CONSTRAINT "PK_tag_links_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tag_links_resource" UNIQUE ("tenantId", "tagId", "resourceType", "resourceId")
      )`,
    );

    // 3. Add Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_tags_tenant_name_normalized" ON "tags" ("tenantId", "nameNormalized")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tag_links_resource" ON "tag_links" ("tenantId", "resourceType", "resourceId")`,
    );

    // 4. Add foreign keys
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_tags_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_links" ADD CONSTRAINT "FK_tag_links_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_links" ADD CONSTRAINT "FK_tag_links_tagId" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // 5. Backfill from people.tags
    await queryRunner.query(`
      DO $$
      DECLARE
          r RECORD;
          tag_name TEXT;
          tag_norm TEXT;
          new_tag_id UUID;
      BEGIN
          -- Loop through people with tags
          FOR r IN SELECT id, "tenantId", tags FROM people WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0 LOOP
              FOR tag_name IN SELECT jsonb_array_elements_text(r.tags) LOOP
                  tag_norm := lower(trim(tag_name));
                  
                  -- Ensure tag exists
                  SELECT id INTO new_tag_id FROM tags WHERE "tenantId" = r."tenantId" AND "nameNormalized" = tag_norm;
                  
                  IF new_tag_id IS NULL THEN
                      INSERT INTO tags ("tenantId", "name", "nameNormalized", "usageCount", "lastUsedAt")
                      VALUES (r."tenantId", tag_name, tag_norm, 1, now())
                      RETURNING id INTO new_tag_id;
                  ELSE
                      UPDATE tags SET "usageCount" = "usageCount" + 1, "lastUsedAt" = now() WHERE id = new_tag_id;
                  END IF;

                  -- Create link
                  INSERT INTO tag_links ("tenantId", "tagId", "resourceType", "resourceId")
                  VALUES (r."tenantId", new_tag_id, 'people', r.id)
                  ON CONFLICT DO NOTHING;
              END LOOP;
          END LOOP;
      END $$;
    `);

    // 6. Backfill from items.tags
    await queryRunner.query(`
      DO $$
      DECLARE
          r RECORD;
          tag_name TEXT;
          tag_norm TEXT;
          new_tag_id UUID;
      BEGIN
          -- Loop through items with tags
          FOR r IN SELECT id, "tenantId", tags FROM items WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0 LOOP
              FOR tag_name IN SELECT jsonb_array_elements_text(r.tags) LOOP
                  tag_norm := lower(trim(tag_name));
                  
                  -- Ensure tag exists
                  SELECT id INTO new_tag_id FROM tags WHERE "tenantId" = r."tenantId" AND "nameNormalized" = tag_norm;
                  
                  IF new_tag_id IS NULL THEN
                      INSERT INTO tags ("tenantId", "name", "nameNormalized", "usageCount", "lastUsedAt")
                      VALUES (r."tenantId", tag_name, tag_norm, 1, now())
                      RETURNING id INTO new_tag_id;
                  ELSE
                      UPDATE tags SET "usageCount" = "usageCount" + 1, "lastUsedAt" = now() WHERE id = new_tag_id;
                  END IF;

                  -- Create link
                  INSERT INTO tag_links ("tenantId", "tagId", "resourceType", "resourceId")
                  VALUES (r."tenantId", new_tag_id, 'items', r.id)
                  ON CONFLICT DO NOTHING;
              END LOOP;
          END LOOP;
      END $$;
    `);

    // 7. Remove legacy tags columns
    await queryRunner.query(`ALTER TABLE "people" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "tags"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore tags columns
    await queryRunner.query(
      `ALTER TABLE "items" ADD "tags" jsonb DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "people" ADD "tags" jsonb DEFAULT '[]'`,
    );

    // We can't easily restore data from tag_links back to jsonb arrays in one simple DOWN migration
    // without complex logic, but usually schema revert is intended for clean state.
    // For safety, we keep it simple here.

    await queryRunner.query(
      `ALTER TABLE "tag_links" DROP CONSTRAINT "FK_tag_links_tagId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tag_links" DROP CONSTRAINT "FK_tag_links_tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT "FK_tags_tenantId"`,
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_tag_links_resource"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tags_tenant_name_normalized"`,
    );

    await queryRunner.query(`DROP TABLE "tag_links"`);
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
