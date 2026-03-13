import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyUsers1710180000000 implements MigrationInterface {
  name = 'CreateCompanyUsers1710180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "company_users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "companyId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" VARCHAR NOT NULL,
        "status" VARCHAR NOT NULL,
        "invitedByUserId" uuid,
        "joinedAt" TIMESTAMP,
        CONSTRAINT "PK_company_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_company_users_company_user_unique" ON "company_users" ("companyId", "userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_company_users_userId" ON "company_users" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_company_users_company_status" ON "company_users" ("companyId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_company_users_company_role" ON "company_users" ("companyId", "role")`,
    );

    await queryRunner.query(`
      ALTER TABLE "company_users"
      ADD CONSTRAINT "FK_company_users_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "company_users"
      ADD CONSTRAINT "FK_company_users_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "company_users"
      ADD CONSTRAINT "FK_company_users_invitedByUser"
      FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company_users" DROP CONSTRAINT "FK_company_users_invitedByUser"
    `);
    await queryRunner.query(`
      ALTER TABLE "company_users" DROP CONSTRAINT "FK_company_users_user"
    `);
    await queryRunner.query(`
      ALTER TABLE "company_users" DROP CONSTRAINT "FK_company_users_company"
    `);

    await queryRunner.query(
      `DROP INDEX "IDX_company_users_company_role"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_company_users_company_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_company_users_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_company_users_company_user_unique"`,
    );

    await queryRunner.query(`DROP TABLE "company_users"`);
  }
}

