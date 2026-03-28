import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'node:path';
import { DataSource, type LogLevel } from 'typeorm';

/**
 * TypeORM CLI only — used with typeorm-ts-node-commonjs (-d src/data-source.ts).
 * Does not change Nest runtime; keep synchronize / migrationsRun off in app.module.
 *
 * Connection: set either DATABASE_URL (e.g. Render "External Database URL") or
 * DB_HOST + DB_USERNAME + DB_PASSWORD + DB_NAME (same split vars as the app).
 */
config();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Postgres host only — not a connection string (use DATABASE_URL for that). */
function dbHost(): string {
  const raw = requiredEnv('DB_HOST').trim();
  if (raw.includes('://')) {
    throw new Error(
      'DB_HOST must be the hostname only (e.g. dpg-xxxxx-a.oregon-postgres.render.com), not a URL. Set DATABASE_URL to the full postgres:// or postgresql:// string from Render instead, or keep separate DB_USERNAME / DB_PASSWORD / DB_NAME.',
    );
  }
  if (/^https?:\/\//i.test(raw)) {
    throw new Error(
      'DB_HOST must be the PostgreSQL server hostname only, not an HTTP(S) URL. Use DATABASE_URL for a postgres connection string, or copy the DB host from Render → Postgres → Connections.',
    );
  }
  // Short "dpg-…" labels are usually internal-only; from your PC you need the full external host (contains a dot).
  if (/^dpg-[a-z0-9-]+$/i.test(raw) && !raw.includes('.')) {
    throw new Error(
      'DB_HOST looks like an incomplete Render Postgres hostname (internal label only). From your machine, use the full external host from Render → Postgres → Connections (e.g. dpg-xxxxx-a.oregon-postgres.render.com), not the short dpg-…-a name alone.',
    );
  }
  return raw;
}

function createDataSource(): DataSource {
  const url = process.env.DATABASE_URL?.trim();
  const base = {
    type: 'postgres' as const,
    entities: [join(__dirname, '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
    migrationsRun: false,
    logging: ['migration', 'warn', 'error'] as LogLevel[],
  };

  if (url) {
    return new DataSource({ ...base, url });
  }

  return new DataSource({
    ...base,
    host: dbHost(),
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: requiredEnv('DB_USERNAME'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME'),
  });
}

export default createDataSource();
