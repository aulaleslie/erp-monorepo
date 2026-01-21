import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateLedgerEntriesTable1769022000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ledger_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'document_id',
            type: 'uuid',
          },
          {
            name: 'entry_type',
            type: 'enum',
            enum: ['DEBIT', 'CREDIT'],
          },
          {
            name: 'account_id',
            type: 'uuid',
          },
          {
            name: 'account_code',
            type: 'varchar',
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
          },
          {
            name: 'currency_code',
            type: 'varchar',
            default: "'IDR'",
          },
          {
            name: 'cost_center_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'posted_at',
            type: 'timestamptz',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'deleted_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('ledger_entries', [
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'documents',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chart_of_accounts',
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['cost_center_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cost_centers',
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ledger_entries');
  }
}
