import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function useD1() {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID?.trim() &&
      process.env.CLOUDFLARE_D1_DATABASE_ID?.trim() &&
      process.env.CLOUDFLARE_API_TOKEN?.trim(),
  );
}

function d1Endpoint() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID.trim();
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID.trim();
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
}

/**
 * Normalise les paramètres pour l’API D1 (null explicite pour SQL NULL).
 */
function d1Params(values) {
  return values.map((v) => (v === undefined ? null : v));
}

async function d1Query(sql, params = []) {
  const { data } = await axios.post(
    d1Endpoint(),
    { sql, params: d1Params(params) },
    {
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN.trim()}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (data.success === false) {
    const msg =
      data.errors?.map((e) => e.message).join('; ') || JSON.stringify(data.errors || data);
    throw new Error(`D1: ${msg}`);
  }
  return data;
}

function d1FirstRow(data) {
  const block = data.result?.[0];
  if (!block?.success) return null;
  const rows = block.results;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}

/* ---------- SQLite local (sans variables D1) ---------- */

let sqliteDb = null;
let sqliteInitPromise = null;

async function getSqliteDb() {
  if (sqliteDb) return sqliteDb;
  if (sqliteInitPromise) return sqliteInitPromise;

  sqliteInitPromise = (async () => {
    if (process.env.VERCEL && !useD1()) {
      throw new Error(
        'Vercel : définissez CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID et CLOUDFLARE_API_TOKEN pour D1. SQLite dans /tmp nest pas fiable.',
      );
    }
    const { default: Database } = await import('better-sqlite3');
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, 'uso.db');
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_spotify TEXT NOT NULL,
        token_user TEXT NOT NULL UNIQUE,
        refresh_token TEXT
      )
    `);
    for (const stmt of [
      'ALTER TABLE user ADD COLUMN refresh_token TEXT',
      'ALTER TABLE user ADD COLUMN osu_access_token TEXT',
      'ALTER TABLE user ADD COLUMN osu_refresh_token TEXT',
      'ALTER TABLE user ADD COLUMN osu_username TEXT',
    ]) {
      try {
        db.exec(stmt);
      } catch {
        /* colonne déjà présente */
      }
    }
    sqliteDb = db;
    return sqliteDb;
  })();

  return sqliteInitPromise;
}

/**
 * À appeler au démarrage (app.js). D1 : aucune init locale ; SQLite : crée data/uso.db.
 */
export async function initDb() {
  if (useD1()) {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[db] Cloudflare D1 (API HTTP)');
    }
    return;
  }
  await getSqliteDb();
  if (process.env.NODE_ENV !== 'test') {
    console.log('[db] SQLite local (backend/data/uso.db)');
  }
}

export async function findUserByToken(token) {
  if (!token) return null;
  const sql = 'SELECT * FROM user WHERE token_user = ?';

  if (useD1()) {
    const data = await d1Query(sql, [token]);
    return d1FirstRow(data);
  }

  const db = await getSqliteDb();
  return db.prepare(sql).get(token) || null;
}

export async function insertUserSession(accessToken, tokenUser, refreshToken) {
  if (useD1()) {
    await d1Query(
      'INSERT INTO user (token_spotify, token_user, refresh_token) VALUES (?, ?, ?)',
      [accessToken, tokenUser, refreshToken ?? null],
    );
    return;
  }
  const db = await getSqliteDb();
  db
    .prepare('INSERT INTO user (token_spotify, token_user, refresh_token) VALUES (?, ?, ?)')
    .run(accessToken, tokenUser, refreshToken ?? null);
}

export async function updateUserOsu(tokenUser, osuAccessToken, osuRefreshToken, osuUsername) {
  if (useD1()) {
    await d1Query(
      'UPDATE user SET osu_access_token = ?, osu_refresh_token = ?, osu_username = ? WHERE token_user = ?',
      [osuAccessToken, osuRefreshToken ?? null, osuUsername ?? null, tokenUser],
    );
    return;
  }
  const db = await getSqliteDb();
  db
    .prepare(
      'UPDATE user SET osu_access_token = ?, osu_refresh_token = ?, osu_username = ? WHERE token_user = ?',
    )
    .run(osuAccessToken, osuRefreshToken ?? null, osuUsername ?? null, tokenUser);
}

/** Supprime la session USO (déconnexion Spotify + osu! côté serveur). */
export async function deleteUserByToken(token) {
  if (!token) return 0;
  const sql = 'DELETE FROM user WHERE token_user = ?';

  if (useD1()) {
    await d1Query(sql, [token]);
    return 1;
  }

  const db = await getSqliteDb();
  const r = db.prepare(sql).run(token);
  return r.changes ?? 0;
}
