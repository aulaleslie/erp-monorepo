import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class CreateDocumentNumberSettings1769020000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'document_number_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'documentKey',
            type: 'varchar',
          },
          {
            name: 'prefix',
            type: 'varchar',
          },
          {
            name: 'paddingLength',
            type: 'int',
            default: 6,
          },
          {
            name: 'includePeriod',
            type: 'boolean',
            default: true,
          },
          {
            name: 'periodFormat',
            type: 'varchar',
            default: "'yyyy-MM'",
          },
          {
            name: 'lastPeriod',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'currentCounter',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deletedBy',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'document_number_settings',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'document_number_settings',
      new TableUnique({
        name: 'UQ_document_number_settings_tenant_key',
        columnNames: ['tenantId', 'documentKey'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('document_number_settings');
  }
}
