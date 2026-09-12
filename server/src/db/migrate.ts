import fs from 'fs';
import path from 'path';
import { db } from './connection';

// In dev (tsx) this file lives at src/db/migrate.ts, so migrations are at ../migrations.
// In the bundled build, dist/index.js sits at the project root, so migrations are copied to ./migrations.
const candidates = [path.resolve(__dirname, '../migrations'), path.resolve(__dirname, './migrations')];
const migrationsDir = candidates.find((c) => fs.existsSync(c)) || candidates[0];

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    (db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[]).map((r) => r.name)
  );

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
    console.log(`Migration applied: ${file}`);
  }
}
