<template>
  <div class="App">
    <Banner />
    <SpotifyPage :use-value="tab" @remove="removeTrack" />
    <SearchOsu :selected-id-tab="tab.idTab || []" @add="addTrack" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Banner from '../components/Banner.vue';
import SearchOsu from '../components/SearchOsu.vue';
import SpotifyPage from '../components/SpotifyPage.vue';

const tab = ref({ idTab: [] });

function addTrack(item) {
  tab.value = { idTab: [...(tab.value.idTab || []), item] };
}

function removeTrack(index) {
  const idTab = [...(tab.value.idTab || [])];
  idTab.splice(index, 1);
  tab.value = { idTab };
}
</script>
