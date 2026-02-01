<template>
  <div class="bloc2">
    <div class="header">
      <h2>Musiques Osu</h2>
      <form class="osuForm" @submit.prevent="handleSubmit">
        <input
          v-model="pseudo"
          name="osuPseudo"
          type="text"
          class="osuPseudo"
          placeholder="Pseudo Joueur"
          :disabled="loading"
        />
        <button type="submit" class="submitButton" :disabled="loading">
          <img src="../assets/search.svg" alt="Search" />
        </button>
      </form>
    </div>
    <div v-if="loading && tracksAccumulated.length === 0" class="loader-wrap">
      <div class="loader" aria-hidden="true"></div>
      <p>Recherche des beatmaps…</p>
    </div>
    <div v-else>
      <div class="avatarParent">
        <img v-if="linkAvatar" :src="linkAvatar" class="Avatar" alt="" />
        <div>
          <p>{{ realPseudo }}</p>
          <p v-if="beatmap">
            Nombre de Beatmaps jouées: <span>{{ beatmap }}</span>
          </p>
        </div>
      </div>
    </div>
    <div ref="scrollEl" class="scroll2" @scroll="onScroll">
      <div
        v-for="(item, key) in musicListByKey"
        :key="`${item.id}-${key}`"
        :class="['music', 'music1', trackClass(item), { 'display-none': isInPlaylist(item) }]"
        :id="'number' + item.id"
        @click="onClick(item)"
        @mouseenter="onMouseEnter(item)"
        @mouseleave="onMouseLeave(item)"
      >
        {{ item.title }}
      </div>
      <div v-if="loading && tracksAccumulated.length > 0" class="loader-inline">
        <div class="loader" aria-hidden="true"></div>
        <span>Chargement…</span>
      </div>
      <div v-else-if="hasMore && tracksAccumulated.length > 0" class="load-more-hint">
        Défilez pour charger plus
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getOsuPseudo } from '../api';

const PAGE_SIZE = 20;

const props = defineProps({
  selectedIdTab: { type: Array, default: () => [] },
});
const emit = defineEmits(['add']);

const pseudo = ref('');
const tracksAccumulated = ref([]);
const userInfo = ref(null);
const nextOffset = ref(0);
const hasMore = ref(false);
const loading = ref(false);
const scrollEl = ref(null);

const oldColor = ref(0);
const hovered = ref(false);
const color = ref('rose');
const linkAvatar = ref('');
const beatmap = ref('');
const realPseudo = ref('');
const colorMap = ref({});

const colorOptions = ['vert', 'bleu', 'rose', 'orange', 'jaune'];

const musicListByKey = computed(() => tracksAccumulated.value);

function isInPlaylist(item) {
  return (props.selectedIdTab || []).some((t) => t && t.id === item.id);
}

function trackClass(item) {
  return colorMap.value[item.id] || '';
}

function setColor(ok, id) {
  if (!ok) return;
  if (hovered.value) {
    let colorValue = Math.floor(Math.random() * colorOptions.length);
    if (colorValue === oldColor.value) {
      colorValue = Math.floor(Math.random() * colorOptions.length);
    }
    oldColor.value = colorValue;
    color.value = colorOptions[colorValue];
    colorMap.value[id] = color.value;
  }
}

function onMouseEnter(item) {
  const ok = !isInPlaylist(item);
  hovered.value = true;
  setColor(ok, item.id);
}

function onMouseLeave(item) {
  hovered.value = false;
  setColor(false, item.id);
}

function onClick(item) {
  if (isInPlaylist(item)) return;
  emit('add', item);
}

async function handleSubmit() {
  const token = localStorage.getItem('userToken') || '';
  if (!token || token === 'error') {
    alert('Connectez-vous d’abord à Spotify.');
    return;
  }
  if (!pseudo.value.trim()) return;
  loading.value = true;
  tracksAccumulated.value = [];
  userInfo.value = null;
  nextOffset.value = 0;
  hasMore.value = false;
  try {
    const res = await getOsuPseudo({ pseudo: pseudo.value.trim(), offset: 0, limit: PAGE_SIZE });
    const list = res.list || [];
    const tracks = Array.isArray(list[0]) ? list[0] : [];
    const info = list[1] || {};
    tracksAccumulated.value = tracks;
    userInfo.value = info;
    nextOffset.value = res.nextOffset ?? tracks.length;
    hasMore.value = Boolean(res.hasMore);
    if (info.avatar != null) linkAvatar.value = info.avatar;
    if (info.baetmapsCount != null) beatmap.value = info.baetmapsCount;
    realPseudo.value = pseudo.value;
  } catch (err) {
    alert(err.response?.data?.error || err.message || 'Problème lors de la récupération de cet utilisateur');
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (loading.value || !hasMore.value || !realPseudo.value.trim()) return;
  loading.value = true;
  try {
    const res = await getOsuPseudo({
      pseudo: realPseudo.value.trim(),
      offset: nextOffset.value,
      limit: PAGE_SIZE,
    });
    const list = res.list || [];
    const tracks = Array.isArray(list[0]) ? list[0] : [];
    tracksAccumulated.value = [...tracksAccumulated.value, ...tracks];
    nextOffset.value = res.nextOffset ?? nextOffset.value + tracks.length;
    hasMore.value = Boolean(res.hasMore);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

const SCROLL_THRESHOLD = 150;

function onScroll() {
  const el = scrollEl.value;
  if (!el || loading.value || !hasMore.value) return;
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD) {
    loadMore();
  }
}
</script>

<style scoped>
.loader-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  min-height: 120px;
}
.loader-wrap p,
.loader-inline span {
  font-size: 0.95rem;
  color: #555;
}
.loader-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
}
.load-more-hint {
  padding: 0.5rem;
  font-size: 0.85rem;
  color: #888;
  text-align: center;
}
.loader {
  width: 28px;
  height: 28px;
  border: 3px solid #eee;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
