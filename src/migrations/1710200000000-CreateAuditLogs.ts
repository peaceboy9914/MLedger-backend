import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1710200000000 implements MigrationInterface {
  name = 'CreateAuditLogs1710200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "companyId" uuid NOT NULL,
        "actorUserId" uuid,
        "actorMembershipId" uuid,
        "action" VARCHAR(100) NOT NULL,
        "entityType" VARCHAR(100) NOT NULL,
        "entityId" uuid,
        "metadata" jsonb,
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_company_createdAt" ON "audit_logs" ("companyId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_company_action" ON "audit_logs" ("companyId", "action")`,
    );

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_actorUser"
      FOREIGN KEY ("actorUserId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_actorMembership"
      FOREIGN KEY ("actorMembershipId") REFERENCES "company_users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_actorUser"
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_actorMembership"
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_company"
    `);

    await queryRunner.query(
      `DROP INDEX "IDX_audit_logs_company_action"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_audit_logs_company_createdAt"`,
    );

    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}

