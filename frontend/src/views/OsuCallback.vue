<template>
  <div class="callback-page">
    <p v-if="status === 'loading'">Connexion osu! en cours…</p>
    <p v-if="status === 'error'" class="error">{{ errorMessage }}</p>
    <p v-if="status === 'success'">Redirection…</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getOsuRedirectUri, OSU_STATE_KEY, clearOsuOAuthState } from '../api/osuAuth';
import { linkOsuAccount } from '../api/index';

const router = useRouter();
const status = ref('loading');
const errorMessage = ref('');

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    status.value = 'error';
    errorMessage.value =
      error === 'access_denied' ? 'Connexion osu! annulée.' : `Erreur osu!: ${error}`;
    clearOsuOAuthState();
    return;
  }

  const storedState = localStorage.getItem(OSU_STATE_KEY);
  if (!storedState || state !== storedState) {
    status.value = 'error';
    errorMessage.value =
      storedState == null
        ? 'Session osu! expirée : réessayez depuis la page Compte.'
        : 'État invalide (session expirée ou lien incorrect).';
    clearOsuOAuthState();
    return;
  }

  if (!code) {
    status.value = 'error';
    errorMessage.value = 'Code d’autorisation manquant.';
    clearOsuOAuthState();
    return;
  }

  try {
    clearOsuOAuthState();
    await linkOsuAccount(code, getOsuRedirectUri());
    status.value = 'success';
    router.replace({ name: 'account' });
  } catch (err) {
    status.value = 'error';
    const statusCode = err.response?.status;
    const apiErr = err.response?.data?.error;
    const looksUnauthorized =
      statusCode === 401 || String(apiErr || '').toLowerCase() === 'unauthorized';
    errorMessage.value = looksUnauthorized
      ? 'Session non reconnue par le serveur (Unauthorized). Souvent dû au déploiement Vercel sans base persistante : réessayez, ou reconnectez-vous à Spotify puis liez osu! à nouveau. Pour corriger durablement, utilisez une base de données hébergée.'
      : apiErr || err.message || 'Erreur lors de la liaison du compte osu!.';
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
