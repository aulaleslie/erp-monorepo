import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTenantFlags1767000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('tenants', [
      new TableColumn({
        name: 'is_taxable',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'is_eatery',
        type: 'boolean',
        default: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tenants', 'is_eatery');
    await queryRunner.dropColumn('tenants', 'is_taxable');
  }
}
