/**
 * OAuth utilisateur osu! (authorization code).
 * @see https://osu.ppy.sh/docs/index.html#authorization-code-grant
 */

import { generateState } from './spotifyAuth';

export const OSU_STATE_KEY = 'osu_oauth_state';

export function getOsuRedirectUri() {
  const env = (import.meta.env.VITE_OSU_REDIRECT_URI || '').trim().replace(/\/+$/, '');
  if (env) return env;
  const origin = window.location.origin;
  const base = origin.includes('localhost') ? origin.replace('localhost', '127.0.0.1') : origin;
  return `${base.replace(/\/+$/, '')}/callback-osu`;
}

/**
 * Redirige vers osu!. Nécessite une session USO (Spotify) pour lier le compte côté API.
 */
export function startOsuLogin() {
  const clientId = import.meta.env.VITE_OSU_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_OSU_CLIENT_ID est requis (même valeur que OSU_CLIENT_ID côté backend).');
  }
  const userToken = localStorage.getItem('userToken');
  if (!userToken) {
    throw new Error('Connectez-vous d’abord à Spotify pour lier votre compte osu!.');
  }
  const state = generateState();
  localStorage.setItem(OSU_STATE_KEY, state);
  const redirectUri = getOsuRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'public identify',
    state,
  });
  window.location.href = `https://osu.ppy.sh/oauth/authorize?${params.toString()}`;
}

export function clearOsuOAuthState() {
  localStorage.removeItem(OSU_STATE_KEY);
}
