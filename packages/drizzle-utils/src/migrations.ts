import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

/**
 * Discovers and runs pending Drizzle ORM migrations against the provided database.
 *
 * Migration folders are resolved by searching the following paths relative to `baseFolder`
 * (or `process.cwd()` when omitted):
 * `./db/migrations`, `./src/db/migrations`, `./migrations`, `./src/migrations`.
 *
 * @param drizzle - A Drizzle ORM `NodePgDatabase` instance.
 * @param migrationsSchema - The Postgres schema used to store the migrations table.
 * @param baseFolder - Optional base directory used to locate the migrations folder.
 * @returns A promise that resolves when all pending migrations have been applied.
 * @throws Error When no migrations folder is found or when a migration fails.
 * @public
 */
export async function runMigrations(drizzle: NodePgDatabase, migrationsSchema: string, baseFolder?: string): Promise<void> {
  const basePath = baseFolder ?? process.cwd();
  const optionalFolders = ['./db/migrations', './src/db/migrations', './migrations', './src/migrations'].map((folder) => path.join(basePath, folder));
  let migrationsFolder = null;

  for (const folder of optionalFolders) {
    if (!existsSync(folder)) {
      continue;
    }
    const folderContent = readdirSync(folder, { withFileTypes: true });

    const hasMigrations = folderContent.some((item) => item.isDirectory() && existsSync(path.join(folder, item.name, 'migration.sql')));
    if (hasMigrations) {
      migrationsFolder = folder;
      break;
    }
  }

  if (migrationsFolder === null) {
    throw new Error('No migrations folder found');
  }

  const res = await migrate(drizzle, { migrationsFolder: migrationsFolder, migrationsSchema });

  if (typeof res === 'object') {
    throw new Error(`Migrations failed with exit code: ${res.exitCode}`);
  }
}
