import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableColumn,
} from 'typeorm';

export class CreateGroupSessionsTables1769610000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add maxParticipants to items
    await queryRunner.addColumn(
      'items',
      new TableColumn({
        name: 'maxParticipants',
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
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'purchaserMemberId',
            type: 'uuid',
          },
          {
            name: 'itemId',
            type: 'uuid',
          },
          {
            name: 'itemName',
            type: 'varchar',
          },
          {
            name: 'sourceDocumentId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sourceDocumentItemId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'instructorId',
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
            name: 'totalSessions',
            type: 'int',
          },
          {
            name: 'usedSessions',
            type: 'int',
            default: 0,
          },
          {
            name: 'remainingSessions',
            type: 'int',
          },
          {
            name: 'maxParticipants',
            type: 'int',
          },
          {
            name: 'startDate',
            type: 'date',
          },
          {
            name: 'expiryDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'pricePaid',
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
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
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

    await queryRunner.createForeignKeys('group_sessions', [
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['purchaserMemberId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['itemId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'items',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['instructorId'],
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
            name: 'groupSessionId',
            type: 'uuid',
          },
          {
            name: 'memberId',
            type: 'uuid',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
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

    await queryRunner.createForeignKeys('group_session_participants', [
      new TableForeignKey({
        columnNames: ['groupSessionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'group_sessions',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['memberId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'CASCADE',
      }),
    ]);

    // 4. Update schedule_bookings
    // 4. Update schedule_bookings
    // groupSessionId column is already created in CreateScheduleBookingsTable migration

    await queryRunner.createForeignKey(
      'schedule_bookings',
      new TableForeignKey({
        columnNames: ['groupSessionId'],
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
      (fk) => fk.columnNames.indexOf('groupSessionId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('schedule_bookings', foreignKey);
    }
    await queryRunner.dropColumn('schedule_bookings', 'groupSessionId');

    // 3. Create group_session_participants table
    await queryRunner.dropTable('group_session_participants');

    // 2. Create group_sessions table
    await queryRunner.dropTable('group_sessions');

    // 1. Add maxParticipants to items
    await queryRunner.dropColumn('items', 'maxParticipants');
  }
}
