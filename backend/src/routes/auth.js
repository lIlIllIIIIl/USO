import crypto from 'crypto';
import { insertUserSession } from '../db.js';

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
  await insertUserSession(accessToken, tokenUser, refreshToken || null);

  res.json({ token: tokenUser });
}
