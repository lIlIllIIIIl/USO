import crypto from 'crypto';
import { getDb } from '../db.js';

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://127.0.0.1:5173').replace(/\/?$/, '');

/**
 * Enregistre une session utilisateur après OAuth PKCE (frontend).
 * Body: { access_token, refresh_token? }
 * Retourne: { token } (token_user à stocker côté frontend).
 */
export async function registerSession(req, res) {
  const { access_token: accessToken, refresh_token: refreshToken } = req.body || {};
  if (!accessToken) {
    return res.status(400).json({ error: 'Missing access_token' });
  }

  const tokenUser = crypto.randomBytes(20).toString('hex');
  const database = getDb();
  database
    .prepare(
      'INSERT INTO user (token_spotify, token_user, refresh_token) VALUES (?, ?, ?)'
    )
    .run(accessToken, tokenUser, refreshToken || null);

  res.json({ token: tokenUser });
}
