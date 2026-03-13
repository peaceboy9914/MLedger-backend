import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShareTransactions1710150000000 implements MigrationInterface {
  name = 'CreateShareTransactions1710150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "share_transactions_type_enum" AS ENUM ('ISSUE', 'TRANSFER', 'BUYBACK')
    `);
    await queryRunner.query(`
      CREATE TABLE "share_transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" "share_transactions_type_enum" NOT NULL,
        "companyId" uuid NOT NULL,
        "fromShareholderId" uuid,
        "toShareholderId" uuid,
        "shares" integer NOT NULL,
        "note" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_share_transactions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_share_transactions_company_type" ON "share_transactions" ("companyId", "type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_share_transactions_company_toShareholder" ON "share_transactions" ("companyId", "toShareholderId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_share_transactions_company_fromShareholder" ON "share_transactions" ("companyId", "fromShareholderId")
    `);
    await queryRunner.query(`
      ALTER TABLE "share_transactions"
      ADD CONSTRAINT "FK_share_transactions_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "share_transactions"
      ADD CONSTRAINT "FK_share_transactions_fromShareholder"
      FOREIGN KEY ("fromShareholderId") REFERENCES "shareholders"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "share_transactions"
      ADD CONSTRAINT "FK_share_transactions_toShareholder"
      FOREIGN KEY ("toShareholderId") REFERENCES "shareholders"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "share_transactions" DROP CONSTRAINT "FK_share_transactions_toShareholder"`);
    await queryRunner.query(`ALTER TABLE "share_transactions" DROP CONSTRAINT "FK_share_transactions_fromShareholder"`);
    await queryRunner.query(`ALTER TABLE "share_transactions" DROP CONSTRAINT "FK_share_transactions_company"`);
    await queryRunner.query(`DROP INDEX "IDX_share_transactions_company_fromShareholder"`);
    await queryRunner.query(`DROP INDEX "IDX_share_transactions_company_toShareholder"`);
    await queryRunner.query(`DROP INDEX "IDX_share_transactions_company_type"`);
    await queryRunner.query(`DROP TABLE "share_transactions"`);
    await queryRunner.query(`DROP TYPE "share_transactions_type_enum"`);
  }
}
