import { createRouter, createWebHistory } from 'vue-router';
import ConnexionPage from '../views/ConnexionPage.vue';
import PlaylistPage from '../views/PlaylistPage.vue';
import SpotifyCallback from '../views/SpotifyCallback.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: ConnexionPage },
    { path: '/playlist-creator', name: 'playlist', component: PlaylistPage },
    { path: '/callback', name: 'spotifyCallback', component: SpotifyCallback },
  ],
});

export default router;
