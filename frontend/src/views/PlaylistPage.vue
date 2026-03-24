<template>
  <div class="App">
    <Banner />
    <p v-if="editLoading" class="playlist-page__status">Chargement de la playlist…</p>
    <div
      v-else-if="playlistIdFromRoute() && editError"
      class="playlist-page__status playlist-page__status--error"
    >
      <p>{{ editError }}</p>
      <button type="button" class="playlist-page__retry" @click="syncEditorFromRoute">Réessayer</button>
    </div>
    <template v-else>
      <SpotifyPage
        :use-value="tab"
        :spotify-playlist-id="spotifyPlaylistId"
        :initial-playlist-name="initialPlaylistName"
        @remove="removeTrack"
      />
      <SearchOsu :selected-id-tab="tab.idTab || []" @add="addTrack" />
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Banner from '../components/Banner.vue';
import SearchOsu from '../components/SearchOsu.vue';
import SpotifyPage from '../components/SpotifyPage.vue';
import { fetchSpotifyPlaylistEditor } from '../api';

const route = useRoute();

const tab = ref({ idTab: [] });
const spotifyPlaylistId = ref(null);
const initialPlaylistName = ref('');
const editLoading = ref(false);
const editError = ref('');

function playlistIdFromRoute() {
  const raw = route.query.spotifyPlaylistId;
  if (raw == null || raw === '') return null;
  return Array.isArray(raw) ? raw[0] : raw;
}

async function syncEditorFromRoute() {
  const id = playlistIdFromRoute();
  editError.value = '';

  if (!id) {
    spotifyPlaylistId.value = null;
    initialPlaylistName.value = '';
    tab.value = { idTab: [] };
    editLoading.value = false;
    return;
  }

  editLoading.value = true;
  spotifyPlaylistId.value = id;
  try {
    const data = await fetchSpotifyPlaylistEditor(id);
    initialPlaylistName.value = data.name || '';
    tab.value = { idTab: Array.isArray(data.tracks) ? data.tracks : [] };
  } catch (err) {
    const d = err.response?.data;
    spotifyPlaylistId.value = null;
    initialPlaylistName.value = '';
    tab.value = { idTab: [] };
    editError.value =
      d?.message || d?.error || err.message || 'Impossible de charger cette playlist.';
  } finally {
    editLoading.value = false;
  }
}

watch(
  () => route.query.spotifyPlaylistId,
  () => {
    syncEditorFromRoute();
  },
  { immediate: true },
);

function addTrack(item) {
  tab.value = { idTab: [...(tab.value.idTab || []), item] };
}

function removeTrack(index) {
  const idTab = [...(tab.value.idTab || [])];
  idTab.splice(index, 1);
  tab.value = { idTab };
}
</script>

<style scoped>
.playlist-page__status {
  padding: 1rem 1.25rem;
  font-size: 0.9rem;
  color: #333;
}

.playlist-page__status--error {
  color: #b00020;
}

.playlist-page__retry {
  margin-top: 0.75rem;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid #000;
  background: #fff;
  border-radius: 6px;
}

.playlist-page__retry:hover {
  background: #f4f4f4;
}
</style>
