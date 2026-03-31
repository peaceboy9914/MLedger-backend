import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendCompanyStatusAndSuspensionFields1710300000000
  implements MigrationInterface
{
  name = 'ExtendCompanyStatusAndSuspensionFields1710300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "companies_status_enum"
      ADD VALUE IF NOT EXISTS 'PENDING_REVIEW'
    `);

    await queryRunner.query(`
      ALTER TYPE "companies_status_enum"
      ADD VALUE IF NOT EXISTS 'ARCHIVED'
    `);

    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "suspendedByUserId" uuid,
      ADD COLUMN IF NOT EXISTS "suspensionReason" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP COLUMN IF EXISTS "suspendedAt",
      DROP COLUMN IF EXISTS "suspendedByUserId",
      DROP COLUMN IF EXISTS "suspensionReason"
    `);
    // Enum value removal is non-trivial and typically not performed in down migrations.
  }
}

