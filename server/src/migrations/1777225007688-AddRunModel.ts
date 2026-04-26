import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRunModel1777225007688 implements MigrationInterface {
  name = 'AddRunModel1777225007688';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "runs" ADD "model" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "runs" DROP COLUMN "model"`);
  }
}
