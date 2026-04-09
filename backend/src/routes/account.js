import axios from 'axios';
import { findUserByToken, updateUserOsu } from '../db.js';
import { getPlaylistForEditor } from '../services/spotifyService.js';

const OSU_TOKEN_URL = process.env.OSU_BASE_URL || 'https://osu.ppy.sh/oauth/token';
const OSU_CLIENT_ID = process.env.OSU_CLIENT_ID;
const OSU_SECRET = process.env.OSU_SECRET;

/**
 * Body: { token }
 * Retourne l’état de liaison Spotify / osu! pour la session USO.
 */
export async function accountStatus(req, res) {
  const token = req.body?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }
  const user = await findUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let spotifyDisplayName = null;
  let spotifyUserId = null;
  try {
    const me = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${user.token_spotify}` },
    });
    spotifyDisplayName = me.data?.display_name || me.data?.id || null;
    spotifyUserId = me.data?.id != null ? String(me.data.id) : null;
  } catch {
    /* jeton Spotify expiré ou invalide */
  }

  let osuUserId = null;
  let osuUsername = user.osu_username || null;
  if (user.osu_access_token) {
    try {
      const meOsu = await axios.get('https://osu.ppy.sh/api/v2/me', {
        headers: { Authorization: `Bearer ${user.osu_access_token}` },
      });
      if (meOsu.data?.id != null) {
        osuUserId = meOsu.data.id;
      }
      if (meOsu.data?.username) {
        osuUsername = meOsu.data.username;
      }
    } catch {
      /* jeton osu! expiré ou invalide */
    }
  }

  res.json({
    spotifyConnected: true,
    spotifyDisplayName,
    spotifyUserId,
    osuConnected: Boolean(user.osu_access_token),
    osuUsername,
    osuUserId,
  });
}

/**
 * Body: { token, code, redirect_uri } — OAuth authorization code osu! (utilisateur).
 */
export async function linkOsu(req, res) {
  const { token, code, redirect_uri: redirectUri } = req.body || {};
  if (!token || !code || !redirectUri) {
    return res.status(400).json({ error: 'Missing token, code or redirect_uri' });
  }
  if (!OSU_CLIENT_ID || !OSU_SECRET) {
    return res.status(503).json({ error: 'Osu OAuth is not configured on the server (OSU_CLIENT_ID / OSU_SECRET).' });
  }

  const user = await findUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const params = new URLSearchParams({
      client_id: OSU_CLIENT_ID,
      client_secret: OSU_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const tokenRes = await axios.post(OSU_TOKEN_URL, params, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const accessToken = tokenRes.data?.access_token;
    const refreshToken = tokenRes.data?.refresh_token || null;
    if (!accessToken) {
      return res.status(502).json({ error: 'Invalid token response from osu!' });
    }

    const meRes = await axios.get('https://osu.ppy.sh/api/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const username = meRes.data?.username || null;
    const osuUserId = meRes.data?.id ?? null;

    await updateUserOsu(token, accessToken, refreshToken, username);

    res.json({ ok: true, osuUsername: username, osuUserId });
  } catch (err) {
    const msg =
      err.response?.data?.error_description ||
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Osu link failed';
    console.error('link-osu:', msg);
    res.status(502).json({ error: String(msg) });
  }
}

const SPOTIFY_PAGE_LIMIT = 50;
/** Garde-fou si un compte a une quantité extrême de playlists. */
const SPOTIFY_PLAYLISTS_MAX = 5000;
/** Nombre de playlists renvoyées au premier chargement. */
const SPOTIFY_INITIAL_PLAYLISTS = 4;

function mapSpotifyPlaylist(pl) {
  return {
    id: pl.id,
    name: pl.name,
    imageUrl: pl.images?.[0]?.url || null,
    spotifyUrl: pl.external_urls?.spotify || null,
    ownerName: pl.owner?.display_name || null,
  };
}

/**
 * Parcourt GET /v1/me/playlists (pages Spotify) et extrait une fenêtre [skip, skip+take) ou le reste si take=null.
 */
async function fetchSpotifyPlaylistsPaged(accessToken, { skip = 0, take = null }) {
  let nextUrl = 'https://api.spotify.com/v1/me/playlists';
  let first = true;
  let apiTotal = null;
  let streamIndex = 0;
  const out = [];

  while (nextUrl) {
    const response = await axios.get(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: first ? { limit: SPOTIFY_PAGE_LIMIT, offset: 0 } : undefined,
    });
    first = false;
    if (apiTotal == null) {
      apiTotal = Number(response.data?.total) || 0;
    }

    for (const pl of response.data?.items || []) {
      if (streamIndex < skip) {
        streamIndex++;
        continue;
      }
      if (streamIndex >= SPOTIFY_PLAYLISTS_MAX) {
        return {
          playlists: out,
          total: apiTotal,
          hasMore: false,
          truncatedMax: apiTotal > SPOTIFY_PLAYLISTS_MAX,
        };
      }
      out.push(mapSpotifyPlaylist(pl));
      streamIndex++;

      if (take != null && out.length >= take) {
        const delivered = skip + out.length;
        const cap = Math.min(apiTotal, SPOTIFY_PLAYLISTS_MAX);
        return {
          playlists: out,
          total: apiTotal,
          hasMore: delivered < cap,
          truncatedMax: false,
        };
      }
    }

    nextUrl = response.data?.next || null;
  }

  const delivered = skip + out.length;
  return {
    playlists: out,
    total: apiTotal ?? delivered,
    hasMore: false,
    truncatedMax:
      (apiTotal || 0) > SPOTIFY_PLAYLISTS_MAX && delivered >= SPOTIFY_PLAYLISTS_MAX,
  };
}

/**
 * Playlists Spotify : par défaut 4, puis body.loadAll=true pour charger la suite.
 * Body: { token, loadAll?: boolean }
 */
export async function spotifyUserPlaylists(req, res) {
  const token = req.body?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }
  const user = await findUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accessToken = user.token_spotify;
  const loadAll = Boolean(req.body?.loadAll);

  try {
    const result = loadAll
      ? await fetchSpotifyPlaylistsPaged(accessToken, {
          skip: SPOTIFY_INITIAL_PLAYLISTS,
          take: null,
        })
      : await fetchSpotifyPlaylistsPaged(accessToken, {
          skip: 0,
          take: SPOTIFY_INITIAL_PLAYLISTS,
        });

    res.json({
      playlists: result.playlists,
      total: result.total,
      hasMore: result.hasMore,
      truncatedMax: result.truncatedMax,
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 403) {
      return res.status(403).json({
        error: 'spotify_scope',
        message:
          'Spotify n’a pas autorisé la lecture des playlists (y compris privées). Déconnectez-vous puis reconnectez-vous à Spotify depuis USO.',
      });
    }
    if (status === 401) {
      return res.status(401).json({
        error: 'spotify_auth',
        message: 'Session Spotify expirée — reconnectez-vous.',
      });
    }
    console.error('spotifyUserPlaylists:', err.response?.data || err.message);
    res.status(502).json({ error: 'Impossible de joindre Spotify.' });
  }
}

/**
 * Données d’une playlist pour l’écran d’édition USO.
 * Body: { token, playlistId }
 */
export async function spotifyPlaylistEditor(req, res) {
  const token = req.body?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const rawId = req.body?.playlistId;
  const playlistId =
    typeof rawId === 'string' ? rawId.trim() : rawId != null ? String(rawId).trim() : '';
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }
  if (!playlistId) {
    return res.status(400).json({ error: 'Missing playlistId' });
  }

  const user = await findUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { name, tracks } = await getPlaylistForEditor(user.token_spotify, playlistId);
    res.json({ name, tracks });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      return res.status(401).json({
        error: 'spotify_auth',
        message: 'Session Spotify expirée — reconnectez-vous.',
      });
    }
    if (status === 403 || status === 404) {
      return res.status(status).json({
        error: 'spotify_playlist',
        message: 'Impossible d’accéder à cette playlist (droits ou playlist introuvable).',
      });
    }
    console.error('spotifyPlaylistEditor:', err.response?.data || err.message);
    res.status(502).json({ error: 'Impossible de charger la playlist Spotify.' });
  }
}

/**
 * Beatmapsets les plus joués pour l’utilisateur osu! lié (token utilisateur OAuth).
 * Body: { token, limit?, offset? }
 */
export async function osuMostPlayedBeatmaps(req, res) {
  const token = req.body?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }
  const user = await findUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!user.osu_access_token) {
    return res.status(400).json({ error: 'Osu not linked' });
  }

  const limit = Math.min(Math.max(Number(req.body?.limit) || 20, 1), 50);
  const offset = Math.max(Number(req.body?.offset) || 0, 0);

  try {
    const meRes = await axios.get('https://osu.ppy.sh/api/v2/me', {
      headers: { Authorization: `Bearer ${user.osu_access_token}` },
    });
    const userId = meRes.data?.id;
    if (!userId) {
      return res.status(502).json({ error: 'Profil osu! invalide.' });
    }

    const mapsRes = await axios.get(
      `https://osu.ppy.sh/api/v2/users/${userId}/beatmapsets/most_played`,
      {
        headers: { Authorization: `Bearer ${user.osu_access_token}` },
        params: { limit, offset },
      },
    );

    let raw = mapsRes.data;
    if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) {
      raw = raw.data;
    }
    if (!Array.isArray(raw)) {
      raw = [];
    }

    /** most_played → BeatmapPlaycount : beatmap.total_length prioritaire. */
    const totalLengthSeconds = (item) => {
      const bm = item.beatmap;
      if (bm?.total_length != null && Number.isFinite(Number(bm.total_length))) {
        return Math.max(0, Math.floor(Number(bm.total_length)));
      }
      const set = item.beatmapset || {};
      if (set.total_length != null && Number.isFinite(Number(set.total_length))) {
        return Math.max(0, Math.floor(Number(set.total_length)));
      }
      const maps = set.beatmaps;
      if (Array.isArray(maps) && maps.length) {
        const lens = maps
          .map((m) => m?.total_length)
          .filter((n) => n != null && Number.isFinite(Number(n)))
          .map((n) => Math.floor(Number(n)));
        if (lens.length) return Math.max(...lens);
      }
      return null;
    };

    const beatmaps = raw.map((item) => {
      const set = item.beatmapset || {};
      const covers = set.covers || {};
      const beatmapId = item.beatmap_id ?? item.beatmap?.id ?? null;
      return {
        beatmapId,
        beatmapsetId: set.id,
        title: set.title || '',
        artist: set.artist || '',
        totalLengthSeconds: totalLengthSeconds(item),
        coverUrl: covers.list2x || covers.list || covers.cover || null,
        osuUrl: set.id ? `https://osu.ppy.sh/beatmapsets/${set.id}` : null,
      };
    });

    const hasMore = beatmaps.length === limit;

    res.json({ beatmaps, hasMore });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      return res.status(401).json({
        error: 'osu_auth',
        message: 'Session osu! expirée — reconnectez votre compte osu!.',
      });
    }
    console.error('osuMostPlayedBeatmaps:', err.response?.data || err.message);
    res.status(502).json({ error: 'Impossible de joindre osu!.' });
  }
}
