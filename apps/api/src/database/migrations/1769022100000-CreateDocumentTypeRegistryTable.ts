import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDocumentTypeRegistryTable1769022100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'document_type_registry',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'document_key',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'module',
            type: 'enum',
            enum: ['SALES', 'PURCHASE', 'ACCOUNTING', 'INVENTORY'],
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requires_items',
            type: 'boolean',
            default: false,
          },
          {
            name: 'approval_steps',
            type: 'int',
            default: 1,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('document_type_registry');
  }
}
