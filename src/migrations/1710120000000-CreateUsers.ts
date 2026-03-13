import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1710120000000 implements MigrationInterface {
  name = 'CreateUsers1710120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM (
        'SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'AUDITOR', 'SHAREHOLDER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "users_status_enum" AS ENUM ('ACTIVE', 'SUSPENDED')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "fullName" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying,
        "passwordHash" character varying NOT NULL,
        "role" "users_role_enum" NOT NULL,
        "status" "users_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "companyId" uuid,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_company"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_status_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
