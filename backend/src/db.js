import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * Sur Vercel : SQLite vit dans /tmp par instance serverless. Chaque invocation peut
 * être une autre machine → base vide ou différente → 401 « Unauthorized » aléatoires
 * alors que le navigateur a encore `userToken` en localStorage. Il faut une base
 * persistante (Turso, Supabase, Neon, etc.) pour un comportement fiable en prod.
 */
const dataDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'uso.db');

export function initDb() {
  const dbInstance = new Database(dbPath);
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_spotify TEXT NOT NULL,
      token_user TEXT NOT NULL UNIQUE,
      refresh_token TEXT
    )
  `);
  try {
    dbInstance.exec('ALTER TABLE user ADD COLUMN refresh_token TEXT');
  } catch (_) {
    /* column may already exist on existing DBs */
  }
  try {
    dbInstance.exec('ALTER TABLE user ADD COLUMN osu_access_token TEXT');
  } catch (_) {
    /* may already exist */
  }
  try {
    dbInstance.exec('ALTER TABLE user ADD COLUMN osu_refresh_token TEXT');
  } catch (_) {
    /* may already exist */
  }
  try {
    dbInstance.exec('ALTER TABLE user ADD COLUMN osu_username TEXT');
  } catch (_) {
    /* may already exist */
  }
  return dbInstance;
}

import fs from 'fs';

export let db;

export function getDb() {
  if (!db) {
    const dir = path.dirname(dbPath);
    if (!process.env.VERCEL && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = initDb();
  }
  return db;
}
