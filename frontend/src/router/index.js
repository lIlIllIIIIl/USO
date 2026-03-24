import { createRouter, createWebHistory } from 'vue-router';
import ConnexionPage from '../views/ConnexionPage.vue';
import PlaylistPage from '../views/PlaylistPage.vue';
import SpotifyCallback from '../views/SpotifyCallback.vue';
import AccountPage from '../views/AccountPage.vue';
import OsuCallback from '../views/OsuCallback.vue';

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

export default router;
