import axios from 'axios';

const SPOTIFY_BASE_URL = (process.env.SPOTIFY_BASE_URL || 'https://api.spotify.com/v1/').replace(/\/?$/, '/');

export async function getSpotifyId(accessToken) {
  const res = await axios.get(`${SPOTIFY_BASE_URL}me/`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.data.id;
}

export async function getOsuMusic(osuData, user) {
  const spotifyToken = user.token_spotify;
  const tab = [];
  for (const item of osuData[0] || []) {
    const title = item.titre;
    const searchUrl = `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(title)}&type=track&market=FR&limit=1`;
    try {
      const trackRes = await axios.get(searchUrl, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
      const music = trackRes.data;
      if (music?.tracks?.items?.[0]) {
        const track = music.tracks.items[0];
        tab.push({ id: track.id, title: track.name });
      }
    } catch (_) {
      // skip track if not found
    }
  }

  const seen = new Set();
  const unique = tab.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  if (unique.length === 0) {
    return 'Pas de musique sur ce joueur';
  }

  return [
    unique,
    { avatar: osuData[1]?.avatar, baetmapsCount: osuData[1]?.baetmapsCount },
  ];
}

export async function createPlaylist(userSpotifyToken, data) {
  const userId = await getSpotifyId(userSpotifyToken);
  const name = data.name || 'Nouvelle playlist';
  const body = {
    name,
    description: 'Playlist créée par USO',
    public: true,
  };

  const createRes = await axios.post(
    `${SPOTIFY_BASE_URL}users/${userId}/playlists`,
    body,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userSpotifyToken}`,
      },
    }
  );

  const playlistId = createRes.data.id;
  const music = data.music || {};
  const musicsIdArr = [];
  // Support format { idTab: [ {id, title}, ... ] } from frontend
  const list = Array.isArray(music.idTab) ? music.idTab : Object.values(music).flat();
  for (const v of list) {
    if (v && typeof v === 'object' && v.id) musicsIdArr.push(v.id);
  }

  if (musicsIdArr.length === 0) {
    return { snapshot_id: playlistId };
  }

  const uris = musicsIdArr.map((id) => `spotify:track:${id}`).join(',');
  const addRes = await axios.post(
    `${SPOTIFY_BASE_URL}playlists/${playlistId}/tracks?uris=${encodeURIComponent(uris)}`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userSpotifyToken}`,
      },
    }
  );

  return addRes.data;
}

/**
 * Nom + pistes (id Spotify + titre) pour l’éditeur USO. Ignore les titres locaux.
 */
export async function getPlaylistForEditor(accessToken, playlistId) {
  const metaRes = await axios.get(`${SPOTIFY_BASE_URL}playlists/${playlistId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const name = metaRes.data?.name || 'Playlist';

  const tracks = [];
  let url = `${SPOTIFY_BASE_URL}playlists/${playlistId}/tracks?limit=100`;
  while (url) {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    for (const item of res.data.items || []) {
      const t = item.track;
      if (t && !t.is_local && t.id && t.name) {
        tracks.push({ id: t.id, title: t.name });
      }
    }
    url = res.data.next || null;
  }

  return { name, tracks };
}

const SPOTIFY_TRACK_URI_BATCH = 100;

/**
 * Met à jour le nom et remplace toutes les pistes (batchs de 100 côté API Spotify).
 */
export async function updateSpotifyPlaylist(userSpotifyToken, data) {
  const playlistId = data.spotifyPlaylistId;
  if (!playlistId) {
    throw new Error('Missing spotifyPlaylistId');
  }

  const name = data.name || 'Playlist';
  await axios.put(
    `${SPOTIFY_BASE_URL}playlists/${playlistId}`,
    {
      name,
      description: 'Playlist modifiée par USO',
      public: true,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userSpotifyToken}`,
      },
    }
  );

  const music = data.music || {};
  const list = Array.isArray(music.idTab) ? music.idTab : Object.values(music).flat();
  const musicsIdArr = [];
  for (const v of list) {
    if (v && typeof v === 'object' && v.id) musicsIdArr.push(v.id);
  }

  const uris = musicsIdArr.map((id) => `spotify:track:${id}`);

  if (uris.length === 0) {
    await axios.put(
      `${SPOTIFY_BASE_URL}playlists/${playlistId}/tracks`,
      { uris: [] },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userSpotifyToken}`,
        },
      }
    );
    return { ok: true };
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userSpotifyToken}`,
  };

  for (let i = 0; i < uris.length; i += SPOTIFY_TRACK_URI_BATCH) {
    const chunk = uris.slice(i, i + SPOTIFY_TRACK_URI_BATCH);
    if (i === 0) {
      await axios.put(`${SPOTIFY_BASE_URL}playlists/${playlistId}/tracks`, { uris: chunk }, { headers });
    } else {
      await axios.post(`${SPOTIFY_BASE_URL}playlists/${playlistId}/tracks`, { uris: chunk }, { headers });
    }
  }

  return { ok: true };
}
