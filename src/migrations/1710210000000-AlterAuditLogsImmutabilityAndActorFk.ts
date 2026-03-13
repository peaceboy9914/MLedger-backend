import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAuditLogsImmutabilityAndActorFk1710210000000
  implements MigrationInterface
{
  name = 'AlterAuditLogsImmutabilityAndActorFk1710210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure actorUserId is nullable and has FK with SET NULL
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "actorUserId" DROP NOT NULL
    `);

    // If an earlier version had updatedAt/deletedAt, drop them to reinforce immutability
    const hasUpdatedAt = await queryRunner.hasColumn('audit_logs', 'updatedAt');
    if (hasUpdatedAt) {
      await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "updatedAt"`);
    }
    const hasDeletedAt = await queryRunner.hasColumn('audit_logs', 'deletedAt');
    if (hasDeletedAt) {
      await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "deletedAt"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert nullable change
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "actorUserId" SET NOT NULL
    `);

    // Recreate columns if needed (without restoring values)
    const hasUpdatedAt = await queryRunner.hasColumn('audit_logs', 'updatedAt');
    if (!hasUpdatedAt) {
      await queryRunner.query(
        `ALTER TABLE "audit_logs" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
      );
    }
    const hasDeletedAt = await queryRunner.hasColumn('audit_logs', 'deletedAt');
    if (!hasDeletedAt) {
      await queryRunner.query(
        `ALTER TABLE "audit_logs" ADD "deletedAt" TIMESTAMP`,
      );
    }
  }
}

