import crypto from 'crypto';
import { insertUserSession, deleteUserByToken } from '../db.js';

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

/**
 * Déconnexion : supprime la ligne utilisateur (jetons Spotify + osu! côté API).
 * Body: { token }
 */
export async function logoutSession(req, res) {
  const token = req.body?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }
  try {
    await deleteUserByToken(token);
    res.json({ ok: true });
  } catch (err) {
    console.error('logoutSession:', err.message);
    res.status(500).json({ error: 'Impossible de terminer la session.' });
  }
}
