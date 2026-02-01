import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './css/style.css';
import './css/playlistStyle.css';

// Spotify PKCE : tout le flux doit être sur la même origine (127.0.0.1).
// Sinon sessionStorage (state, code_verifier) n’est pas partagé entre localhost et 127.0.0.1.
if (window.location.hostname === 'localhost') {
  const url = `http://127.0.0.1:${window.location.port}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(url);
} else {
  createApp(App).use(router).mount('#app');
}
