<template>
  <div class="callback-page">
    <p v-if="status === 'loading'">Connexion en cours…</p>
    <p v-if="status === 'error'" class="error">{{ errorMessage }}</p>
    <p v-if="status === 'success'">Redirection…</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { exchangeCodeForToken, getStoredState, clearStoredState } from '../api/spotifyAuth';
import axios from 'axios';

const router = useRouter();
const status = ref('loading');
const errorMessage = ref('');

const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/?$/, '')
  : '/api';
const api = axios.create({ baseURL });

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    status.value = 'error';
    errorMessage.value = error === 'access_denied'
      ? 'Connexion annulée.'
      : `Erreur Spotify: ${error}`;
    clearStoredState();
    return;
  }

  const storedState = getStoredState();
  if (state !== storedState) {
    status.value = 'error';
    const expectedOrigin = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
      ? import.meta.env.VITE_SPOTIFY_REDIRECT_URI.replace(/\/callback\/?$/, '')
      : window.location.origin;
    errorMessage.value = storedState == null
      ? `Session perdue : reconnectez-vous à Spotify en partant de cette même adresse (${expectedOrigin}), puis relancez la connexion.`
      : 'État invalide (session expirée ou lien incorrect).';
    clearStoredState();
    return;
  }

  if (!code) {
    status.value = 'error';
    errorMessage.value = 'Code d’autorisation manquant.';
    clearStoredState();
    return;
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    const { data } = await api.post('/register-session', {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    localStorage.setItem('userToken', data.token || '');
    status.value = 'success';
    router.replace('/playlist-creator');
  } catch (err) {
    status.value = 'error';
    const apiHint = window.location.origin.includes('127.0.0.1') || window.location.origin.includes('localhost')
      ? 'Vérifiez que l’API tourne (ex. http://127.0.0.1:8081) et que VITE_API_URL ou le proxy /api pointe vers elle.'
      : 'Vérifiez que l’API est déployée et accessible (ex. /api sur ce domaine).';
    const msg = err.response?.data?.error
      || err.message
      || (err.code === 'ERR_NETWORK'
        ? `Backend injoignable : ${apiHint}`
        : 'Erreur lors de l’échange du code.');
    errorMessage.value = msg;
    clearStoredState();
  }
});
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
}
.error {
  color: #c00;
}
</style>
