<template>
  <div class="homeContainer">
    <Banner />
    <div class="blocConnect">
      <div class="title">
        <h1>USO, le créateur</h1>
        <h1>de playlist OSU</h1>
      </div>
      <a
        href="#"
        :class="['spotifyConnexion', 'connect', color]"
        @click.prevent="handleConnect"
        @mouseenter="mouseChange"
        @mouseleave="mouseChange"
      >
        <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.668 7C12.802 7 9.66797 3.86599 9.66797 4.17233e-07" stroke="black" stroke-width="0.8"/>
          <path d="M9.66797 14C9.66797 10.134 12.802 7 16.668 7" stroke="black" stroke-width="0.8"/>
          <path d="M16.6667 7L0 7" stroke="black" stroke-width="0.8"/>
        </svg>
        Connexion à <span>Spotify</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Banner from '../components/Banner.vue';
import { startSpotifyLogin } from '../api/spotifyAuth';

const colorTab = ['basicVert', 'basicBleu', 'basicRose', 'basicOrange', 'basicJaune'];
const color = ref('');
const oldColor = ref(9);
const hovered = ref(false);

function doColor() {
  let colorValue = Math.floor(Math.random() * colorTab.length);
  if (colorValue === oldColor.value) {
    colorValue = Math.floor(Math.random() * colorTab.length);
  }
  oldColor.value = colorValue;
  color.value = colorTab[colorValue];
}

function mouseChange() {
  hovered.value = !hovered.value;
  doColor();
}

async function handleConnect() {
  try {
    await startSpotifyLogin();
  } catch (e) {
    alert(e.message || 'Erreur de configuration Spotify (VITE_SPOTIFY_CLIENT_ID).');
  }
}

onMounted(() => {
  doColor();
});
</script>
