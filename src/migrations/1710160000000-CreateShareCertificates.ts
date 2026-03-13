import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShareCertificates1710160000000 implements MigrationInterface {
  name = 'CreateShareCertificates1710160000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "share_certificates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "certificateNumber" character varying NOT NULL,
        "companyId" uuid NOT NULL,
        "shareholderId" uuid NOT NULL,
        "sharesIssued" integer NOT NULL,
        "issuedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_share_certificates_certificateNumber" UNIQUE ("certificateNumber"),
        CONSTRAINT "PK_share_certificates_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_share_certificates_company_issuedAt" ON "share_certificates" ("companyId", "issuedAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_share_certificates_company_shareholder" ON "share_certificates" ("companyId", "shareholderId")
    `);
    await queryRunner.query(`
      ALTER TABLE "share_certificates"
      ADD CONSTRAINT "FK_share_certificates_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "share_certificates"
      ADD CONSTRAINT "FK_share_certificates_shareholder"
      FOREIGN KEY ("shareholderId") REFERENCES "shareholders"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "share_certificates" DROP CONSTRAINT "FK_share_certificates_shareholder"`);
    await queryRunner.query(`ALTER TABLE "share_certificates" DROP CONSTRAINT "FK_share_certificates_company"`);
    await queryRunner.query(`DROP INDEX "IDX_share_certificates_company_shareholder"`);
    await queryRunner.query(`DROP INDEX "IDX_share_certificates_company_issuedAt"`);
    await queryRunner.query(`DROP TABLE "share_certificates"`);
  }
}
