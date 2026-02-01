/**
 * Flux Authorization Code avec PKCE (recommandé Spotify 2025).
 * @see https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const SCOPE = 'user-read-private playlist-modify-private playlist-modify-public';
const CODE_VERIFIER_KEY = 'spotify_code_verifier';
const STATE_KEY = 'spotify_state';

function getClientId() {
  const id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  if (!id) throw new Error('VITE_SPOTIFY_CLIENT_ID is required for Spotify PKCE');
  return id;
}

function getRedirectUri() {
  const env = (import.meta.env.VITE_SPOTIFY_REDIRECT_URI || '').trim().replace(/\/+$/, '');
  if (env) return env;
  const origin = window.location.origin;
  // Spotify 2025 : pas de "localhost", utiliser 127.0.0.1
  const base = origin.includes('localhost') ? origin.replace('localhost', '127.0.0.1') : origin;
  return `${base.replace(/\/+$/, '')}/callback`;
}

/**
 * Génère une chaîne aléatoire pour code_verifier (43–128 caractères).
 */
export function generateCodeVerifier() {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(64));
  return Array.from(values, (x) => possible[x % possible.length]).join('');
}

/**
 * Code challenge = base64url(SHA256(code_verifier)).
 */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Génère un state pour la protection CSRF.
 */
export function generateState() {
  const values = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(values, (x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Lance l’autorisation Spotify (PKCE).
 * Stocke code_verifier et state en localStorage (persiste après redirection vers Spotify et retour).
 */
export async function startSpotifyLogin() {
  const clientId = getClientId();
  const redirectUri = getRedirectUri();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  localStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPE,
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  });

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Échange le code d’autorisation contre un access_token (côté frontend, sans client_secret).
 */
export async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
  if (!codeVerifier) throw new Error('Missing code_verifier (session expired or invalid)');

  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.error || `Spotify token error: ${res.status}`);
  }

  const data = await res.json();
  clearStoredState();
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

/**
 * Vérifie le state renvoyé par Spotify (CSRF).
 */
export function getStoredState() {
  return localStorage.getItem(STATE_KEY);
}

export function clearStoredState() {
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(CODE_VERIFIER_KEY);
}
