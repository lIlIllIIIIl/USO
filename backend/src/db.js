import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'uso.db');

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
  return dbInstance;
}

import fs from 'fs';

export let db;

export function getDb() {
  if (!db) {
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    db = initDb();
  }
  return db;
}
