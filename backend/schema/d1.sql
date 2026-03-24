-- À appliquer sur D1 (une fois) :
-- npx wrangler d1 execute <NOM_DB> --remote --file=backend/schema/d1.sql
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_spotify TEXT NOT NULL,
  token_user TEXT NOT NULL UNIQUE,
  refresh_token TEXT,
  osu_access_token TEXT,
  osu_refresh_token TEXT,
  osu_username TEXT
);
