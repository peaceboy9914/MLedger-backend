import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanies1710100000000 implements MigrationInterface {
  name = 'CreateCompanies1710100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "companies_status_enum" AS ENUM ('ACTIVE', 'SUSPENDED')
    `);
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "registrationNumber" character varying NOT NULL,
        "authorizedCapital" numeric(18,2) NOT NULL,
        "issuedCapital" numeric(18,2) NOT NULL DEFAULT 0,
        "paidUpCapital" numeric(18,2) NOT NULL DEFAULT 0,
        "parValue" numeric(18,2) NOT NULL DEFAULT 1,
        "companyCode" character varying,
        "status" "companies_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "UQ_companies_name" UNIQUE ("name"),
        CONSTRAINT "UQ_companies_registrationNumber" UNIQUE ("registrationNumber"),
        CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TYPE "companies_status_enum"`);
  }
}
