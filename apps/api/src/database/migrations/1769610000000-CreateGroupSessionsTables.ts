import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableColumn,
} from 'typeorm';

export class CreateGroupSessionsTables1769610000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add max_participants to items
    await queryRunner.addColumn(
      'items',
      new TableColumn({
        name: 'max_participants',
        type: 'int',
        default: 1,
      }),
    );

    // 2. Create group_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'group_sessions',
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
            name: 'purchaser_member_id',
            type: 'uuid',
          },
          {
            name: 'item_id',
            type: 'uuid',
          },
          {
            name: 'item_name',
            type: 'varchar',
          },
          {
            name: 'source_document_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'source_document_item_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'instructor_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'EXPIRED', 'EXHAUSTED', 'CANCELLED'],
            default: "'ACTIVE'",
          },
          {
            name: 'total_sessions',
            type: 'int',
          },
          {
            name: 'used_sessions',
            type: 'int',
            default: 0,
          },
          {
            name: 'remaining_sessions',
            type: 'int',
          },
          {
            name: 'max_participants',
            type: 'int',
          },
          {
            name: 'start_date',
            type: 'date',
          },
          {
            name: 'expiry_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'price_paid',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'notes',
            type: 'text',
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
            name: 'created_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('group_sessions', [
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['purchaser_member_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['item_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'items',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['instructor_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'people',
        onDelete: 'SET NULL',
      }),
    ]);

    // 3. Create group_session_participants table
    await queryRunner.createTable(
      new Table({
        name: 'group_session_participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'group_session_id',
            type: 'uuid',
          },
          {
            name: 'member_id',
            type: 'uuid',
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

    await queryRunner.createForeignKeys('group_session_participants', [
      new TableForeignKey({
        columnNames: ['group_session_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'group_sessions',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['member_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'CASCADE',
      }),
    ]);

    // 4. Update schedule_bookings
    await queryRunner.addColumn(
      'schedule_bookings',
      new TableColumn({
        name: 'group_session_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'schedule_bookings',
      new TableForeignKey({
        columnNames: ['group_session_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'group_sessions',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 4. Update schedule_bookings
    const table = await queryRunner.getTable('schedule_bookings');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('group_session_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('schedule_bookings', foreignKey);
    }
    await queryRunner.dropColumn('schedule_bookings', 'group_session_id');

    // 3. Create group_session_participants table
    await queryRunner.dropTable('group_session_participants');

    // 2. Create group_sessions table
    await queryRunner.dropTable('group_sessions');

    // 1. Add max_participants to items
    await queryRunner.dropColumn('items', 'max_participants');
  }
}
