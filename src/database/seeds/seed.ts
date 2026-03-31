import 'reflect-metadata';
import { config } from 'dotenv';

config();

import dataSource from '../../data-source';
import { SeedService } from './seed.service';

function assertSafeToSeed(): void {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SEED_ALLOW_UNSAFE !== '1'
  ) {
    console.error(
      '[seed] Refusing to run: NODE_ENV=production requires SEED_ALLOW_UNSAFE=1',
    );
    process.exit(1);
  }
}

function printSummary(summary: Awaited<ReturnType<SeedService['run']>>): void {
  console.log('\n[seed] Done.');
  console.log(
    `[seed] Super admin: ${summary.superAdmin === 'created' ? 'created' : 'skipped (already exists)'}`,
  );
  console.log(
    `[seed] Companies: ${summary.companies.created} created, ${summary.companies.skipped} skipped`,
  );
  console.log(
    `[seed] Users: ${summary.users.created} created, ${summary.users.skipped} skipped`,
  );
  console.log(
    `[seed] Memberships: ${summary.memberships.created} created, ${summary.memberships.skipped} skipped`,
  );
  console.log(`[seed] Audit log rows: ${summary.auditLogs.created} created`);
  console.log('[seed] Passwords and hashes are not printed.\n');
}

async function main(): Promise<void> {
  assertSafeToSeed();

  await dataSource.initialize();
  try {
    const summary = await new SeedService(dataSource).run();
    printSummary(summary);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
