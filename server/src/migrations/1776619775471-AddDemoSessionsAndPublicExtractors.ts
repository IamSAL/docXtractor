import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDemoSessionsAndPublicExtractors1776619775471
  implements MigrationInterface
{
  name = 'AddDemoSessionsAndPublicExtractors1776619775471';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "runs" DROP CONSTRAINT "FK_336a74d21129fee621d57b01799"`,
    );
    await queryRunner.query(
      `CREATE TABLE "demo_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fingerprint" character varying NOT NULL, "email" character varying, "runsUsed" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1b32792a5c615d49fe2641933f6" UNIQUE ("fingerprint"), CONSTRAINT "PK_c01ab53e5154479e902860654c0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1b32792a5c615d49fe2641933f" ON "demo_sessions" ("fingerprint") `,
    );
    await queryRunner.query(`ALTER TABLE "extractor" ADD "userId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "extractor" ADD "isPublic" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "extractor" ADD "category" text`);
    await queryRunner.query(`ALTER TABLE "extractor" ADD "icon" text`);
    await queryRunner.query(`ALTER TABLE "extractor" ADD "tags" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "runs" ADD "isDemo" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca22ee3f26a9f711f5195939b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "runs" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8343e394266c0fc3ae00847041" ON "extractor" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca22ee3f26a9f711f5195939b9" ON "runs" ("userId", "status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "extractor" ADD CONSTRAINT "FK_8343e394266c0fc3ae00847041f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "runs" ADD CONSTRAINT "FK_336a74d21129fee621d57b01799" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "runs" DROP CONSTRAINT "FK_336a74d21129fee621d57b01799"`,
    );
    await queryRunner.query(
      `ALTER TABLE "extractor" DROP CONSTRAINT "FK_8343e394266c0fc3ae00847041f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca22ee3f26a9f711f5195939b9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8343e394266c0fc3ae00847041"`,
    );
    await queryRunner.query(
      `ALTER TABLE "runs" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca22ee3f26a9f711f5195939b9" ON "runs" ("userId", "status") `,
    );
    await queryRunner.query(`ALTER TABLE "runs" DROP COLUMN "isDemo"`);
    await queryRunner.query(`ALTER TABLE "extractor" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "extractor" DROP COLUMN "icon"`);
    await queryRunner.query(`ALTER TABLE "extractor" DROP COLUMN "category"`);
    await queryRunner.query(`ALTER TABLE "extractor" DROP COLUMN "isPublic"`);
    await queryRunner.query(`ALTER TABLE "extractor" DROP COLUMN "userId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1b32792a5c615d49fe2641933f"`,
    );
    await queryRunner.query(`DROP TABLE "demo_sessions"`);
    await queryRunner.query(
      `ALTER TABLE "runs" ADD CONSTRAINT "FK_336a74d21129fee621d57b01799" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
