import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserSessions1710220000000 implements MigrationInterface {
  name = 'CreateUserSessions1710220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "refreshTokenHash" text NOT NULL,
        "userAgent" text,
        "ipAddress" text,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_sessions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_sessions_userId" ON "user_sessions" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_sessions_expiresAt" ON "user_sessions" ("expiresAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_sessions_revokedAt" ON "user_sessions" ("revokedAt")
    `);
    await queryRunner.query(`
      ALTER TABLE "user_sessions"
      ADD CONSTRAINT "FK_user_sessions_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_user_sessions_user"`);
    await queryRunner.query(`DROP INDEX "IDX_user_sessions_revokedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_user_sessions_expiresAt"`);
    await queryRunner.query(`DROP INDEX "IDX_user_sessions_userId"`);
    await queryRunner.query(`DROP TABLE "user_sessions"`);
  }
}
