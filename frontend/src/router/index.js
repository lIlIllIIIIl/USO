import { createRouter, createWebHistory } from 'vue-router';
import ConnexionPage from '../views/ConnexionPage.vue';
import PlaylistPage from '../views/PlaylistPage.vue';
import SpotifyCallback from '../views/SpotifyCallback.vue';
import AccountPage from '../views/AccountPage.vue';
import OsuCallback from '../views/OsuCallback.vue';

/** Session USO après connexion Spotify (même clé que le reste de l’app). */
function hasUserSession() {
  const t = typeof localStorage !== 'undefined' ? localStorage.getItem('userToken') : '';
  return Boolean(t && String(t).trim());
}

/**
 * Sans jeton : uniquement la page de connexion et le retour OAuth Spotify.
 * Avec jeton : `/` redirige vers le compte (« homepage » connectée).
 */
const GUEST_ROUTE_NAMES = new Set(['home', 'spotifyCallback']);

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: ConnexionPage },
    { path: '/playlist-creator', name: 'playlist', component: PlaylistPage },
    { path: '/account', name: 'account', component: AccountPage },
    { path: '/callback', name: 'spotifyCallback', component: SpotifyCallback },
    { path: '/callback-osu', name: 'osuCallback', component: OsuCallback },
  ],
});

router.beforeEach((to, _from, next) => {
  const isAuth = hasUserSession();

  if (isAuth && to.name === 'home') {
    next({ name: 'account', replace: true });
    return;
  }

  if (!isAuth) {
    if (GUEST_ROUTE_NAMES.has(to.name)) {
      next();
      return;
    }
    next({ name: 'home', replace: true });
    return;
  }

  next();
});

export default router;
