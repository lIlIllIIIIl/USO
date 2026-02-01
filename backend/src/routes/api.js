import { getDb } from '../db.js';
import { getOsuToken } from '../services/osuService.js';
import { getOsuMusic, createPlaylist } from '../services/spotifyService.js';

function getUserByToken(token) {
  if (!token) return null;
  const database = getDb();
  return database.prepare('SELECT * FROM user WHERE token_user = ?').get(token);
}

export async function pseudo(req, res) {
  const { pseudo, token, limit, offset } = req.body || {};
  if (!pseudo || !pseudo.trim()) {
    return res.status(400).json({ error: 'Missing pseudo parameter.' });
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const osuData = await getOsuToken(pseudo.trim(), { limit, offset });
    const result = await getOsuMusic([osuData.musicTitleTab, osuData.userInfo], user);
    res.json({
      list: result,
      hasMore: osuData.hasMore,
      nextOffset: osuData.nextOffset,
    });
  } catch (err) {
    console.error('Osu pseudo error:', err.message);
    res.status(500).json({ error: 'Problème lors de la récupération de cet utilisateur' });
  }
}

export async function createPlaylistRoute(req, res) {
  const data = req.body || {};
  const token = data.token;
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await createPlaylist(user.token_spotify, data);
    res.json(result);
  } catch (err) {
    console.error('Create playlist error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Problème lors de la création de la Playlist' });
  }
}
