import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShareholders1710140000000 implements MigrationInterface {
  name = 'CreateShareholders1710140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shareholders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "fullName" character varying NOT NULL,
        "email" character varying,
        "nationalId" character varying,
        "address" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "companyId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_shareholders_email" UNIQUE ("email"),
        CONSTRAINT "UQ_shareholders_nationalId" UNIQUE ("nationalId"),
        CONSTRAINT "PK_shareholders_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_shareholders_fullName" ON "shareholders" ("fullName")
    `);
    await queryRunner.query(`
      ALTER TABLE "shareholders"
      ADD CONSTRAINT "FK_shareholders_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shareholders" DROP CONSTRAINT "FK_shareholders_company"`);
    await queryRunner.query(`DROP INDEX "IDX_shareholders_fullName"`);
    await queryRunner.query(`DROP TABLE "shareholders"`);
  }
}
