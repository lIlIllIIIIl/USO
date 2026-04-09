import axios from 'axios';

/**
 * En local : laisser `VITE_API_URL` vide → proxy Vite `/api` → backend.
 * Ou `http://127.0.0.1:8081` pour appeler Express directement (sans préfixe `/api` dans l’URL).
 * Sur Vercel : laisser vide pour `/api` en même origine. Ne pas mettre seulement
 * `https://votre-app.vercel.app` sans `/api` (sinon 404 sur `/account-status`, etc.).
 */
const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/?$/, '')
  : '/api';

const api = axios.create({ baseURL });

const DEFAULT_PAGE_SIZE = 20;

export async function getOsuPseudo(payload) {
  const token = localStorage.getItem('userToken') || '';
  const body = {
    ...payload,
    token,
    limit: payload.limit ?? DEFAULT_PAGE_SIZE,
    offset: payload.offset ?? 0,
  };
  const { data } = await api.post('/pseudo', body, {
    headers: { Authorization: token },
  });
  return data;
}

export async function sendPlaylist(payload) {
  const { data } = await api.post('/createPlaylist', payload);
  return data;
}

export async function fetchSpotifyPlaylistEditor(playlistId) {
  const token = localStorage.getItem('userToken') || '';
  const { data } = await api.post(
    '/account/spotify-playlist-editor',
    { token, playlistId },
    { headers: { Authorization: token } },
  );
  return data;
}

export async function updatePlaylistRequest(payload) {
  const { data } = await api.post('/updatePlaylist', payload);
  return data;
}

export async function logoutSession() {
  const token = localStorage.getItem('userToken') || '';
  if (!token) return;
  const { data } = await api.post(
    '/logout',
    { token },
    { headers: { Authorization: token } },
  );
  return data;
}

export async function fetchAccountStatus() {
  const token = localStorage.getItem('userToken') || '';
  if (!token) {
    return {
      spotifyConnected: false,
      spotifyDisplayName: null,
      spotifyUserId: null,
      osuConnected: false,
      osuUsername: null,
      osuUserId: null,
    };
  }
  const { data } = await api.post('/account-status', { token }, {
    headers: { Authorization: token },
  });
  return data;
}

export async function linkOsuAccount(code, redirectUri) {
  const token = localStorage.getItem('userToken') || '';
  const { data } = await api.post(
    '/link-osu',
    { token, code, redirect_uri: redirectUri },
    { headers: { Authorization: token } },
  );
  return data;
}

export async function fetchSpotifyPlaylists(options = {}) {
  const token = localStorage.getItem('userToken') || '';
  const { data } = await api.post(
    '/account/spotify-playlists',
    { token, loadAll: Boolean(options.loadAll) },
    { headers: { Authorization: token } },
  );
  return data;
}

export async function fetchOsuMostPlayed(options = {}) {
  const token = localStorage.getItem('userToken') || '';
  const limit = options.limit ?? 24;
  const offset = options.offset ?? 0;
  const { data } = await api.post(
    '/account/osu-most-played',
    { token, limit, offset },
    { headers: { Authorization: token } },
  );
  return data;
}
