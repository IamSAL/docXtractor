import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1777313147579 implements MigrationInterface {
    name = 'InitialSchema1777313147579'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."admin_admintype_enum" AS ENUM('super', 'support')`);
        await queryRunner.query(`CREATE TABLE "admin" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying NOT NULL, "adminType" "public"."admin_admintype_enum" NOT NULL DEFAULT 'support', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "availability" jsonb NOT NULL, "specialty" character varying NOT NULL, "userId" uuid, CONSTRAINT "REL_f8a889c4362d78f056960ca6da" UNIQUE ("userId"), CONSTRAINT "PK_e032310bcef831fb83101899b10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message" character varying NOT NULL, "eventType" character varying NOT NULL, "eventId" character varying NOT NULL, "read" boolean NOT NULL DEFAULT false, "data" jsonb, "channels" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying, "otpHash" character varying, "otpExpiry" TIMESTAMP, "googleId" character varying, "isEmailVerified" boolean NOT NULL DEFAULT false, "profilePicture" character varying, "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_470355432cc67b2c470c30bef7c" UNIQUE ("googleId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_89563b3922141f854f717db7be" ON "user" ("role", "isEmailVerified") `);
        await queryRunner.query(`CREATE TYPE "public"."workflows_status_enum" AS ENUM('draft', 'active', 'paused')`);
        await queryRunner.query(`CREATE TABLE "workflows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "definition" jsonb NOT NULL, "status" "public"."workflows_status_enum" NOT NULL DEFAULT 'draft', "userId" uuid NOT NULL, "triggerConfig" jsonb, "lastTriggeredAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b5757cc1cd86268019fef52e0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."workflow_executions_status_enum" AS ENUM('pending', 'running', 'success', 'failed')`);
        await queryRunner.query(`CREATE TABLE "workflow_executions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workflowId" uuid NOT NULL, "status" "public"."workflow_executions_status_enum" NOT NULL DEFAULT 'pending', "executionData" jsonb, "triggerPayload" jsonb, "errorMessage" text, "startedAt" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d49b5c86c267d902145ed42c9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."node_executions_status_enum" AS ENUM('pending', 'running', 'success', 'failed')`);
        await queryRunner.query(`CREATE TABLE "node_executions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "executionId" uuid NOT NULL, "nodeId" character varying NOT NULL, "nodeType" character varying NOT NULL, "inputData" jsonb, "outputData" jsonb, "status" "public"."node_executions_status_enum" NOT NULL DEFAULT 'pending', "durationMs" integer, "errorMessage" text, "startedAt" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_7c5ce6e9d846482686b422e7dfd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."extractor_conflictresolution_enum" AS ENUM('majority', 'highest_confidence', 'human_review', 'conservative')`);
        await queryRunner.query(`CREATE TYPE "public"."extractor_parserengine_enum" AS ENUM('docling', 'markitdown', 'pymupdf', 'opendataloader')`);
        await queryRunner.query(`CREATE TABLE "extractor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "isPublic" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "description" text, "thumbnailUrl" text, "category" text, "icon" text, "tags" jsonb, "schema" jsonb NOT NULL, "systemPrompt" text NOT NULL, "fewShotExamples" jsonb NOT NULL DEFAULT '[]', "variants" jsonb NOT NULL DEFAULT '[]', "consensusEnabled" boolean NOT NULL DEFAULT false, "confidenceThreshold" double precision NOT NULL DEFAULT '85', "conflictResolution" "public"."extractor_conflictresolution_enum" NOT NULL DEFAULT 'majority', "parserEngine" "public"."extractor_parserengine_enum" NOT NULL DEFAULT 'docling', "citationEnabled" boolean NOT NULL DEFAULT false, "citationIncludePdfPage" boolean NOT NULL DEFAULT false, "citationIncludeBbox" boolean NOT NULL DEFAULT false, "citationIncludeParagraphId" boolean NOT NULL DEFAULT false, "contextWindow" character varying NOT NULL DEFAULT '128k', "defaultModel" character varying NOT NULL DEFAULT 'gpt-4o-mini', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5582d7b83412be01fca01bb1170" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8343e394266c0fc3ae00847041" ON "extractor" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."runs_processingmode_enum" AS ENUM('unified', 'per_document')`);
        await queryRunner.query(`CREATE TYPE "public"."runs_extractionprovider_enum" AS ENUM('doclo', 'langextract', 'freellm')`);
        await queryRunner.query(`CREATE TYPE "public"."runs_status_enum" AS ENUM('pending', 'queued', 'parsing', 'extracting', 'done', 'failed', 'review')`);
        await queryRunner.query(`CREATE TABLE "runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "extractorId" uuid NOT NULL, "userId" uuid, "sources" jsonb NOT NULL, "processingMode" "public"."runs_processingmode_enum" NOT NULL DEFAULT 'unified', "extractionProvider" "public"."runs_extractionprovider_enum" NOT NULL DEFAULT 'doclo', "status" "public"."runs_status_enum" NOT NULL DEFAULT 'pending', "progress" jsonb, "results" jsonb, "metrics" jsonb, "logs" jsonb NOT NULL DEFAULT '[]', "error" text, "confidence" double precision, "autorunId" uuid, "isAutorun" boolean NOT NULL DEFAULT false, "isDemo" boolean DEFAULT false, "variantId" text, "skippedFields" jsonb, "model" text, "sortConfig" jsonb, "workflowExecutionId" uuid, "startedAt" TIMESTAMP, "finishedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_46d6a1e257c38ba58f1a3c30836" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6906dec2148d994d17d1a4a3b5" ON "runs" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_373b603026a04de33489fd2692" ON "runs" ("extractorId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ca22ee3f26a9f711f5195939b9" ON "runs" ("userId", "status") `);
        await queryRunner.query(`CREATE TABLE "push-subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "endpoint" character varying(500) NOT NULL, "p256dhKey" character varying(500) NOT NULL, "authKey" character varying(500) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08bb7ee6a9ec4fce8c3c1ff1f99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_87fccbb0b396eff4955941390e" ON "push-subscriptions" ("userId", "endpoint") `);
        await queryRunner.query(`CREATE TYPE "public"."invite_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."invite_status_enum" AS ENUM('pending', 'accepted', 'expired', 'revoked')`);
        await queryRunner.query(`CREATE TABLE "invite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "email" character varying, "role" "public"."invite_role_enum" NOT NULL DEFAULT 'user', "status" "public"."invite_status_enum" NOT NULL DEFAULT 'pending', "createdById" uuid NOT NULL, "acceptedById" uuid, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_83dbe83cb33c3e8468c8045ea7c" UNIQUE ("token"), CONSTRAINT "PK_fc9fa190e5a3c5d80604a4f63e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "instance_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "instanceName" character varying NOT NULL DEFAULT 'DocXtractor', "allowPublicSignup" boolean NOT NULL DEFAULT false, "smtpHost" character varying, "smtpPort" integer, "smtpUser" character varying, "smtpPass" character varying, "smtpSecure" boolean NOT NULL DEFAULT false, "googleOAuthClientId" character varying, "googleOAuthClientSecret" character varying, "googleOAuthCallbackUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eb2567a5e4188cd54689e1d79ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."files_status_enum" AS ENUM('pending', 'completed')`);
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalName" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "storageKey" character varying NOT NULL, "bucket" character varying NOT NULL DEFAULT 'docxtractor-documents', "status" "public"."files_status_enum" NOT NULL DEFAULT 'pending', "userId" uuid NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f734c17eff711279fdda38cc4ae" UNIQUE ("storageKey"), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a541edf52e3d80b42c51672995" ON "files" ("userId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "demo_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fingerprint" character varying NOT NULL, "email" character varying, "runsUsed" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1b32792a5c615d49fe2641933f6" UNIQUE ("fingerprint"), CONSTRAINT "PK_c01ab53e5154479e902860654c0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1b32792a5c615d49fe2641933f" ON "demo_sessions" ("fingerprint") `);
        await queryRunner.query(`ALTER TABLE "admin" ADD CONSTRAINT "FK_f8a889c4362d78f056960ca6dad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD CONSTRAINT "FK_e6b7312458454123287286afa6e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workflow_executions" ADD CONSTRAINT "FK_2cb399c231cb3f82c63506794bc" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "node_executions" ADD CONSTRAINT "FK_1ae2ec85514f6d5b9b97a0f161c" FOREIGN KEY ("executionId") REFERENCES "workflow_executions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "extractor" ADD CONSTRAINT "FK_8343e394266c0fc3ae00847041f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "runs" ADD CONSTRAINT "FK_373b603026a04de33489fd2692f" FOREIGN KEY ("extractorId") REFERENCES "extractor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "runs" ADD CONSTRAINT "FK_336a74d21129fee621d57b01799" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "runs" ADD CONSTRAINT "FK_2d1962c3d0e1fe76f2921431991" FOREIGN KEY ("workflowExecutionId") REFERENCES "workflow_executions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invite" ADD CONSTRAINT "FK_1fd4ebf122b26dc6c7245e544f3" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invite" ADD CONSTRAINT "FK_180928f0ebd300b55317c75ce72" FOREIGN KEY ("acceptedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_7e7425b17f9e707331e9a6c7335" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_7e7425b17f9e707331e9a6c7335"`);
        await queryRunner.query(`ALTER TABLE "invite" DROP CONSTRAINT "FK_180928f0ebd300b55317c75ce72"`);
        await queryRunner.query(`ALTER TABLE "invite" DROP CONSTRAINT "FK_1fd4ebf122b26dc6c7245e544f3"`);
        await queryRunner.query(`ALTER TABLE "runs" DROP CONSTRAINT "FK_2d1962c3d0e1fe76f2921431991"`);
        await queryRunner.query(`ALTER TABLE "runs" DROP CONSTRAINT "FK_336a74d21129fee621d57b01799"`);
        await queryRunner.query(`ALTER TABLE "runs" DROP CONSTRAINT "FK_373b603026a04de33489fd2692f"`);
        await queryRunner.query(`ALTER TABLE "extractor" DROP CONSTRAINT "FK_8343e394266c0fc3ae00847041f"`);
        await queryRunner.query(`ALTER TABLE "node_executions" DROP CONSTRAINT "FK_1ae2ec85514f6d5b9b97a0f161c"`);
        await queryRunner.query(`ALTER TABLE "workflow_executions" DROP CONSTRAINT "FK_2cb399c231cb3f82c63506794bc"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP CONSTRAINT "FK_e6b7312458454123287286afa6e"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`ALTER TABLE "admin" DROP CONSTRAINT "FK_f8a889c4362d78f056960ca6dad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b32792a5c615d49fe2641933f"`);
        await queryRunner.query(`DROP TABLE "demo_sessions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a541edf52e3d80b42c51672995"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP TYPE "public"."files_status_enum"`);
        await queryRunner.query(`DROP TABLE "instance_settings"`);
        await queryRunner.query(`DROP TABLE "invite"`);
        await queryRunner.query(`DROP TYPE "public"."invite_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invite_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87fccbb0b396eff4955941390e"`);
        await queryRunner.query(`DROP TABLE "push-subscriptions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca22ee3f26a9f711f5195939b9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_373b603026a04de33489fd2692"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6906dec2148d994d17d1a4a3b5"`);
        await queryRunner.query(`DROP TABLE "runs"`);
        await queryRunner.query(`DROP TYPE "public"."runs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."runs_extractionprovider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."runs_processingmode_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8343e394266c0fc3ae00847041"`);
        await queryRunner.query(`DROP TABLE "extractor"`);
        await queryRunner.query(`DROP TYPE "public"."extractor_parserengine_enum"`);
        await queryRunner.query(`DROP TYPE "public"."extractor_conflictresolution_enum"`);
        await queryRunner.query(`DROP TABLE "node_executions"`);
        await queryRunner.query(`DROP TYPE "public"."node_executions_status_enum"`);
        await queryRunner.query(`DROP TABLE "workflow_executions"`);
        await queryRunner.query(`DROP TYPE "public"."workflow_executions_status_enum"`);
        await queryRunner.query(`DROP TABLE "workflows"`);
        await queryRunner.query(`DROP TYPE "public"."workflows_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89563b3922141f854f717db7be"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "admin"`);
        await queryRunner.query(`DROP TYPE "public"."admin_admintype_enum"`);
    }

}
