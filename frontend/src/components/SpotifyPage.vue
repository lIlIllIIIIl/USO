<template>
  <div class="bloc1">
    <div class="header">
      <h1 class="playlistTitle">Nouvelle playlist</h1>
    </div>
    <form class="playlistForm" @submit.prevent="handleSubmit">
      <input
        v-model="name"
        name="playlistName"
        type="text"
        class="playlistName"
        placeholder="Nom de votre playlist"
      />
      <button
        type="submit"
        :class="['buttonPlaylist', alternateColor, { 'is-disabled': playlistItems.length === 0 }]"
        :disabled="playlistItems.length === 0"
        :title="playlistItems.length === 0 ? 'Ajoutez au moins un titre depuis « Musiques Osu »' : ''"
        @mouseenter="onEnter"
        @mouseleave="onLeave"
      >
        <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.668 7C12.802 7 9.66797 3.86599 9.66797 4.17233e-07" stroke="black" stroke-width="0.8"/>
          <path d="M9.66797 14C9.66797 10.134 12.802 7 16.668 7" stroke="black" stroke-width="0.8"/>
          <path d="M16.6667 7L0 7" stroke="black" stroke-width="0.8"/>
        </svg>
        Valider
      </button>
    </form>
    <div class="scroll1">
      <div
        v-for="(item, index) in playlistItems"
        :key="index"
        :class="['music', 'music2', passColorMap[index] || '']"
        :id="'passNumber' + index"
        @click="onClickRemove(index)"
        @mouseenter="onMouseEnter(index)"
        @mouseleave="onMouseLeave(index)"
      >
        {{ item?.title }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { sendPlaylist } from '../api';
import { notify } from '../utils/notify';

const props = defineProps({
  useValue: { type: Object, default: () => ({ idTab: [] }) },
});
const emit = defineEmits(['remove']);

const name = ref('');
const hovered = ref(false);
const oldColor = ref(0);
const color = ref('bleu');
const alternateOldColor = ref(0);
const alternateColor = ref('rose');
const passColorMap = ref({});

const colorOptions = ['vert', 'bleu', 'rose', 'orange', 'jaune'];

const playlistItems = computed(() => {
  const idTab = props.useValue?.idTab;
  if (!idTab || !Array.isArray(idTab)) return [];
  return idTab.filter((t) => t && typeof t === 'object' && t.title);
});

function setColor(ok, id) {
  if (ok && hovered.value) {
    let colorValue = Math.floor(Math.random() * colorOptions.length);
    if (colorValue === oldColor.value) {
      colorValue = Math.floor(Math.random() * colorOptions.length);
    }
    oldColor.value = colorValue;
    color.value = colorOptions[colorValue];
    passColorMap.value = { ...passColorMap.value, [id]: color.value };
  }
}

function setAlternateColor() {
  if (hovered.value) {
    let colorValue = Math.floor(Math.random() * colorOptions.length);
    if (colorValue === alternateOldColor.value) {
      colorValue = Math.floor(Math.random() * colorOptions.length);
    }
    alternateOldColor.value = colorValue;
    alternateColor.value = colorOptions[colorValue];
  }
}

function onEnter() {
  hovered.value = true;
  setAlternateColor();
}

function onLeave() {
  hovered.value = false;
  setAlternateColor();
}

function onMouseEnter(index) {
  hovered.value = true;
  setColor(true, index);
}

function onMouseLeave(index) {
  hovered.value = false;
  setColor(false, index);
}

function onClickRemove(index) {
  emit('remove', index);
  const el = document.getElementById('passNumber' + index);
  if (el) el.className = 'music music2 ' + (passColorMap.value[index] || color.value);
}

async function handleSubmit() {
  if (playlistItems.value.length === 0) return;
  const token = localStorage.getItem('userToken') || '';
  const music = props.useValue || {};
  try {
    await sendPlaylist({ name: name.value, music, token });
    notify('Playlist créée avec succès !');
  } catch (err) {
    notify(
      err.response?.data?.error || err.message || 'Problème lors de la création de la Playlist',
      'error'
    );
  }
}
</script>

<style scoped>
.buttonPlaylist.is-disabled,
.buttonPlaylist:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
