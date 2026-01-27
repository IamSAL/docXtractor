import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateFilesTable1706345678000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'files',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'originalName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'size',
            type: 'bigint',
          },
          {
            name: 'storageKey',
            type: 'varchar',
            length: '500',
            isUnique: true,
          },
          {
            name: 'bucket',
            type: 'varchar',
            length: '100',
            default: "'docxtractor-documents'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'uploaded', 'processing', 'completed', 'failed'],
            default: "'pending'",
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'files',
      new TableIndex({
        name: 'IDX_FILES_USER_CREATED',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'files',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('files');
  }
}
