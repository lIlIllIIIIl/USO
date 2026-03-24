<template>
  <div class="homeContainer">
    <Banner />
    <div class="account-root">
      <main class="account-main">
        <section class="account-panel account-panel--spotify" aria-labelledby="account-spotify-title">
          <div class="account-panel__head">
            <h2 id="account-spotify-title" class="account-panel__title">Spotify</h2>
            <router-link
              v-if="account.spotifyConnected && !loading && !loadError"
              class="account-panel__shortcut"
              :to="{ name: 'playlist' }"
            >
              + Nouvelle playlist
            </router-link>
          </div>
          <div
            class="account-panel__body"
            :class="{ 'account-panel__body--scroll': account.spotifyConnected && !loading && !loadError }"
          >
            <p v-if="loading" class="account-panel__muted">Chargement…</p>
            <template v-else-if="loadError">
              <p class="account-panel__error">{{ loadError }}</p>
              <button type="button" class="account-retry" @click="loadAccount">Réessayer</button>
            </template>
            <template v-else-if="!account.spotifyConnected">
              <p class="account-panel__lead">Connectez votre compte pour voir toutes vos playlists Spotify.</p>
              <button
                type="button"
                :class="['account-connect', spotifyColor]"
                @click="connectSpotify"
                @mouseenter="spotifyHoverEnter"
                @mouseleave="spotifyHoverLeave"
              >
                Se connecter à Spotify
              </button>
            </template>
            <template v-else>
              <p v-if="spotifyFeedLoading" class="account-panel__muted">Chargement des playlists…</p>
              <template v-else-if="spotifyFeedError">
                <p class="account-panel__error">{{ spotifyFeedError }}</p>
                <p v-if="spotifyScopeError" class="account-panel__hint">
                  Une nouvelle autorisation Spotify est nécessaire (lecture des playlists).
                </p>
                <button
                  v-if="spotifyScopeError"
                  type="button"
                  :class="['account-connect account-connect--compact', spotifyColor]"
                  @click="connectSpotify"
                  @mouseenter="spotifyHoverEnter"
                  @mouseleave="spotifyHoverLeave"
                >
                  Reconnecter Spotify
                </button>
              </template>
              <template v-else-if="!spotifyPlaylists.length">
                <p class="account-panel__muted">Aucune playlist sur ce compte Spotify.</p>
              </template>
              <template v-else>
                <p v-if="spotifyTruncatedMax" class="account-panel__hint">
                  Seules les 5000 premières playlists Spotify peuvent être affichées (limite technique).
                </p>
                <div
                  class="account-strip"
                  role="region"
                  aria-label="Playlists Spotify"
                >
                  <div class="account-strip__cluster">
                    <a
                      v-for="p in spotifyPlaylists"
                      :key="p.id"
                      :href="p.spotifyUrl || '#'"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="account-card"
                      :class="{ 'account-card--hot': hoveredPlaylistCardId === p.id }"
                      :style="playlistCardHoverStyle(p.id)"
                      @mouseenter="onPlaylistCardEnter(p.id)"
                      @mouseleave="onPlaylistCardLeave"
                    >
                      <div class="account-card__header">
                        <div
                          class="account-card__spotify"
                          @focus="onPlaylistCardEnter(p.id)"
                          @blur="onPlaylistCardLeave"
                        >
                          <span class="account-card__label">{{ p.name }}</span>
                          <router-link
                            class="account-card__edit"
                            :to="{ name: 'playlist', query: { spotifyPlaylistId: p.id } }"
                            @focus="onPlaylistCardEnter(p.id)"
                            @blur="onPlaylistCardLeave"
                          >
                            <img src="../assets/arrow.svg" alt="" aria-hidden="true" />
                            <span>Modifier</span>
                          </router-link>
                        </div>
                      </div>
                      <span v-if="p.ownerName" class="account-card__meta">par {{ p.ownerName }}</span>
                    </a>
                  </div>
                  <div
                    v-if="spotifyHasMorePlaylists"
                    class="account-card account-card--more"
                    :class="{ 'account-card--hot': hoveredPlaylistCardId === PLAYLIST_MORE_CARD_ID }"
                    :style="playlistCardHoverStyle(PLAYLIST_MORE_CARD_ID)"
                    role="button"
                    tabindex="0"
                    :aria-busy="spotifyLoadMoreLoading"
                    :aria-disabled="spotifyLoadMoreLoading"
                    @mouseenter="onPlaylistCardEnter(PLAYLIST_MORE_CARD_ID)"
                    @mouseleave="onPlaylistCardLeave"
                    @focus="onPlaylistCardEnter(PLAYLIST_MORE_CARD_ID)"
                    @blur="onPlaylistCardLeave"
                    @click="onLoadMorePlaylistsClick"
                    @keydown.enter.prevent="onLoadMorePlaylistsClick"
                    @keydown.space.prevent="onLoadMorePlaylistsClick"
                  >
                    <span class="account-card__label account-card__label--more">
                      <img src="../assets/arrow.svg" alt="Search" />
                      {{ spotifyLoadMoreLoading ? 'Chargement…' : 'Toutes vos playlists' }}
                    </span>
                  </div>
                </div>
                <p v-if="spotifyLoadMoreError" class="account-panel__error account-panel__error--inline">
                  {{ spotifyLoadMoreError }}
                </p>
              </template>
            </template>
          </div>
        </section>
        <section class="account-panel account-panel--osu" aria-labelledby="account-osu-title">
          <h2 id="account-osu-title" class="account-panel__title">Musiques les plus jouées sur osu!</h2>
          <div
            class="account-panel__body"
            :class="{
              'account-panel__body--scroll': account.spotifyConnected && account.osuConnected && !loading && !loadError,
            }"
          >
            <p v-if="loading" class="account-panel__muted">Chargement…</p>
            <template v-else-if="loadError">
              <p class="account-panel__muted">Session non vérifiée — réessayez depuis la section Spotify.</p>
            </template>
            <template v-else-if="!account.spotifyConnected">
              <p class="account-panel__lead">
                Connectez-vous d’abord à Spotify pour lier votre compte osu!.
              </p>
              <button type="button" class="account-connect account-connect--disabled" disabled>
                Se connecter à osu!
              </button>
            </template>
            <template v-else-if="!account.osuConnected">
              <p class="account-panel__lead">Liez osu! pour afficher vos beatmaps les plus jouées.</p>
              <button
                type="button"
                :class="['account-connect', osuColor]"
                @click="connectOsu"
                @mouseenter="osuHoverEnter"
                @mouseleave="osuHoverLeave"
              >
                Se connecter à osu!
              </button>
            </template>
            <template v-else>
              <p class="account-panel__user">@{{ account.osuUsername }}</p>
              <p v-if="osuFeedLoading" class="account-panel__muted">Chargement des beatmaps…</p>
              <template v-else-if="osuFeedError">
                <p class="account-panel__error">{{ osuFeedError }}</p>
              </template>
              <template v-else-if="!osuBeatmaps.length">
                <p class="account-panel__muted">Aucune beatmap renvoyée par osu!.</p>
              </template>
              <ul v-else class="account-beatlist">
                <li v-for="(b, idx) in osuBeatmaps" :key="osuBeatRowKey(b, idx)" class="account-beatrow">
                  <a
                    class="account-beatrow__link"
                    :class="{ 'account-beatrow__link--hot': hoveredOsuBeatRowKey === osuBeatRowKey(b, idx) }"
                    :style="osuBeatRowHoverStyle(osuBeatRowKey(b, idx))"
                    :href="b.osuUrl || '#'"
                    target="_blank"
                    rel="noopener noreferrer"
                    @mouseenter="onOsuBeatRowEnter(osuBeatRowKey(b, idx))"
                    @mouseleave="onOsuBeatRowLeave"
                    @focus="onOsuBeatRowEnter(osuBeatRowKey(b, idx))"
                    @blur="onOsuBeatRowLeave"
                  >
                    <div class="account-beatrow__title-group">
                      <span class="account-beatrow__title">{{ b.title }}</span>
                      <span class="beatrow-separator" aria-hidden="true" />
                    </div>
                    <div class="account-beatrow__artist-group">
                      <span class="account-beatrow__artist">{{ b.artist }}</span>
                      <span class="beatrow-separator" aria-hidden="true" />
                    </div>
                    <span class="account-beatrow__count">{{ formatPlaycount(b.playcount) }}</span>
                  </a>
                </li>
              </ul>
            </template>
          </div>
        </section>
      </main>
      <footer class="account-footer">
        <img class="footer-logo" src="../assets/uso.svg" alt="USO" />
        <span>__________</span>
        <span>
          Projet développé par Jaël Beining, Alexandra Bernard, Antonin Borderie, Lucas Fassel, Patxi Manzano, Inès Richard & Alexis Kessab.
        </span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Banner from '../components/Banner.vue';
import { startSpotifyLogin } from '../api/spotifyAuth';
import { startOsuLogin } from '../api/osuAuth';
import { fetchAccountStatus, fetchSpotifyPlaylists, fetchOsuMostPlayed } from '../api/index';

const colorTab = ['vert', 'bleu', 'rose', 'orange', 'jaune'];

/** Mêmes teintes que le menu / les boutons USO (fond au survol des cartes playlist). */
const CARD_HOVER_BG_PALETTE = ['#3db372', '#4a7df2', '#f31eeb', '#fd7e40', '#f9b125'];
const PLAYLIST_MORE_CARD_ID = '__more__';

const loading = ref(true);
const loadError = ref('');
const account = ref({
  spotifyConnected: false,
  spotifyDisplayName: null,
  osuConnected: false,
  osuUsername: null,
});

const spotifyFeedLoading = ref(false);
const spotifyFeedError = ref('');
const spotifyScopeError = ref(false);
const spotifyPlaylists = ref([]);
const spotifyHasMorePlaylists = ref(false);
const spotifyTruncatedMax = ref(false);
const spotifyLoadMoreLoading = ref(false);
const spotifyLoadMoreError = ref('');

const hoveredPlaylistCardId = ref(null);
const hoverBgByPlaylistCardId = ref({});
let lastPlaylistCardHoverIdx = -1;

const osuFeedLoading = ref(false);
const osuFeedError = ref('');
const osuBeatmaps = ref([]);

const hoveredOsuBeatRowKey = ref(null);
const hoverBgByOsuBeatRowKey = ref({});

const spotifyColor = ref('vert');
const spotifyOld = ref(-1);
const spotifyHovered = ref(false);

const osuColor = ref('vert');
const osuOld = ref(-1);
const osuHovered = ref(false);

function formatPlaycount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function pickColor(tab, oldRef, hovered) {
  if (!hovered) return;
  let i = Math.floor(Math.random() * tab.length);
  if (i === oldRef.value && tab.length > 1) {
    i = (i + 1) % tab.length;
  }
  oldRef.value = i;
  return tab[i];
}

function spotifyHoverEnter() {
  spotifyHovered.value = true;
  const c = pickColor(colorTab, spotifyOld, true);
  if (c) spotifyColor.value = c;
}

function spotifyHoverLeave() {
  spotifyHovered.value = false;
}

function osuHoverEnter() {
  osuHovered.value = true;
  const c = pickColor(colorTab, osuOld, true);
  if (c) osuColor.value = c;
}

function osuHoverLeave() {
  osuHovered.value = false;
}

function pickPlaylistCardHoverBg() {
  if (CARD_HOVER_BG_PALETTE.length < 2) return CARD_HOVER_BG_PALETTE[0];
  let i = Math.floor(Math.random() * CARD_HOVER_BG_PALETTE.length);
  if (i === lastPlaylistCardHoverIdx) {
    i = (i + 1) % CARD_HOVER_BG_PALETTE.length;
  }
  lastPlaylistCardHoverIdx = i;
  return CARD_HOVER_BG_PALETTE[i];
}

function onPlaylistCardEnter(id) {
  const bg = pickPlaylistCardHoverBg();
  hoverBgByPlaylistCardId.value = { ...hoverBgByPlaylistCardId.value, [id]: bg };
  hoveredPlaylistCardId.value = id;
}

function onPlaylistCardLeave() {
  hoveredPlaylistCardId.value = null;
}

function playlistCardHoverStyle(id) {
  if (hoveredPlaylistCardId.value !== id) return {};
  const bg = hoverBgByPlaylistCardId.value[id];
  return bg ? { backgroundColor: bg, color: '#fff' } : {};
}

function osuBeatRowKey(b, idx) {
  return b.beatmapsetId != null ? String(b.beatmapsetId) : `idx-${idx}`;
}

function onOsuBeatRowEnter(key) {
  const bg = pickPlaylistCardHoverBg();
  hoverBgByOsuBeatRowKey.value = { ...hoverBgByOsuBeatRowKey.value, [key]: bg };
  hoveredOsuBeatRowKey.value = key;
}

function onOsuBeatRowLeave() {
  hoveredOsuBeatRowKey.value = null;
}

function osuBeatRowHoverStyle(key) {
  if (hoveredOsuBeatRowKey.value !== key) return {};
  const bg = hoverBgByOsuBeatRowKey.value[key];
  return bg ? { backgroundColor: bg, color: '#fff' } : {};
}

async function loadSpotifyFeed() {
  hoveredPlaylistCardId.value = null;
  spotifyPlaylists.value = [];
  spotifyHasMorePlaylists.value = false;
  spotifyTruncatedMax.value = false;
  spotifyLoadMoreError.value = '';
  spotifyFeedError.value = '';
  spotifyScopeError.value = false;
  if (!account.value.spotifyConnected) return;

  spotifyFeedLoading.value = true;
  try {
    const data = await fetchSpotifyPlaylists();
    spotifyPlaylists.value = data.playlists || [];
    spotifyHasMorePlaylists.value = Boolean(data.hasMore);
    spotifyTruncatedMax.value = Boolean(data.truncatedMax);
  } catch (err) {
    const d = err.response?.data;
    spotifyFeedError.value = d?.message || d?.error || err.message || 'Erreur Spotify.';
    spotifyScopeError.value = d?.error === 'spotify_scope' || err.response?.status === 403;
  } finally {
    spotifyFeedLoading.value = false;
  }
}

function onLoadMorePlaylistsClick() {
  if (!spotifyHasMorePlaylists.value || spotifyLoadMoreLoading.value) return;
  loadAllSpotifyPlaylists();
}

async function loadAllSpotifyPlaylists() {
  if (!spotifyHasMorePlaylists.value || spotifyLoadMoreLoading.value) return;
  spotifyLoadMoreError.value = '';
  spotifyLoadMoreLoading.value = true;
  try {
    const data = await fetchSpotifyPlaylists({ loadAll: true });
    const more = data.playlists || [];
    spotifyPlaylists.value = [...spotifyPlaylists.value, ...more];
    spotifyHasMorePlaylists.value = false;
    if (data.truncatedMax) spotifyTruncatedMax.value = true;
  } catch (err) {
    const d = err.response?.data;
    spotifyLoadMoreError.value =
      d?.message || d?.error || err.message || 'Impossible de charger le reste des playlists.';
  } finally {
    spotifyLoadMoreLoading.value = false;
  }
}

async function loadOsuFeed() {
  hoveredOsuBeatRowKey.value = null;
  osuBeatmaps.value = [];
  osuFeedError.value = '';
  if (!account.value.spotifyConnected || !account.value.osuConnected) return;

  osuFeedLoading.value = true;
  try {
    const data = await fetchOsuMostPlayed(24);
    osuBeatmaps.value = data.beatmaps || [];
  } catch (err) {
    const d = err.response?.data;
    osuFeedError.value = d?.message || d?.error || err.message || 'Erreur osu!.';
  } finally {
    osuFeedLoading.value = false;
  }
}

async function loadAccount() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await fetchAccountStatus();
    account.value = {
      spotifyConnected: Boolean(data.spotifyConnected),
      spotifyDisplayName: data.spotifyDisplayName ?? null,
      osuConnected: Boolean(data.osuConnected),
      osuUsername: data.osuUsername ?? null,
    };
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Impossible de charger le compte.';
    loadError.value = msg;
    account.value = {
      spotifyConnected: false,
      spotifyDisplayName: null,
      osuConnected: false,
      osuUsername: null,
    };
  } finally {
    loading.value = false;
  }

  if (account.value.spotifyConnected && !loadError.value) {
    await Promise.all([loadSpotifyFeed(), loadOsuFeed()]);
  } else {
    spotifyPlaylists.value = [];
    osuBeatmaps.value = [];
  }
}

function connectSpotify() {
  startSpotifyLogin().catch((e) => {
    alert(e.message || 'Erreur de connexion Spotify.');
  });
}

function connectOsu() {
  try {
    startOsuLogin();
  } catch (e) {
    alert(e.message || 'Erreur de connexion osu!.');
  }
}

onMounted(() => {
  loadAccount();
});
</script>

<style scoped>
.account-root {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.account-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-left: 4rem;
  border-top: 1px solid #000;
  border-left: 1px solid #000;
  border-top-left-radius: 160px;
}

.account-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-top: 0.65rem;
  /* border-bottom: 1px solid #000; */
  overflow: hidden;
}

.account-panel--spotify {
  padding: 4rem 0 0 4rem;
}

.account-panel--osu {
  border-bottom: none;
}

.account-panel__head {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  flex-shrink: 0;
  margin-bottom: 0.35rem;
}

.account-panel__title {
  font-family: Degular, system-ui, sans-serif;
  font-size: clamp(1.2rem, 2.8vw, 1.65rem);
  font-weight: 600;
}

.account-panel__shortcut {
  font-size: 0.8rem;
  font-weight: 600;
  color: #000;
  white-space: nowrap;
}

.account-panel__shortcut:hover {
  opacity: 0.7;
}

.account-panel__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
  min-height: 0;
}

.account-panel__body--scroll {
  flex: 1;
  overflow: hidden;
}

.account-panel__user {
  font-size: 0.9rem;
  font-weight: 600;
  flex-shrink: 0;
}

.account-panel__lead,
.account-panel__muted {
  font-size: 0.85rem;
  line-height: 1.35;
  color: #333;
  max-width: 36rem;
}

.account-panel__muted--wrap {
  max-width: none;
}

.account-panel__muted {
  color: #555;
}

.account-panel__hint {
  font-size: 0.8rem;
  color: #444;
  max-width: 28rem;
}

.account-panel__error {
  font-size: 0.85rem;
  color: #b00020;
  max-width: 36rem;
}

.account-panel__error--inline {
  margin-top: 0.35rem;
  max-width: 100%;
}

.account-retry {
  padding: 0.35rem 0.9rem;
  font-size: 0.85rem;
  font-family: inherit;
  font-weight: 600;
  border: 1px solid #000;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
}

.account-retry:hover {
  background: #f0f0f0;
}

.account-connect {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 22rem;
  min-height: 3.25rem;
  padding: 0 1.5rem;
  border: 1px solid #000;
  border-radius: 999px;
  font-family: Degular, system-ui, sans-serif;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  background: #fff;
  color: #000;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.account-connect--compact {
  min-height: 2.5rem;
  font-size: 0.9rem;
  max-width: 18rem;
}

.account-connect--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.account-connect.vert:hover {
  background-color: #3db372;
  color: #fff;
}
.account-connect.bleu:hover {
  background-color: #4a7df2;
  color: #fff;
}
.account-connect.rose:hover {
  background-color: #f31eeb;
  color: #fff;
}
.account-connect.orange:hover {
  background-color: #fd7e40;
  color: #fff;
}
.account-connect.jaune:hover {
  background-color: #f9b125;
  color: #fff;
}

/* Spotify — défilement horizontal */
.account-strip {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  align-self: stretch;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.account-strip__cluster {
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
}

.account-card {
  border-top: 1px solid #000;
  border-left: 1px solid #000;
  border-bottom: 1px solid #000;
  border-top-left-radius: 40px;
  margin-right: -40px;
  padding: 2rem 1rem 1rem 1rem;

  flex: 0 0 auto;
  width: 18rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.25rem;
  text-decoration: none;
  color: #000;
  background-color: #fff;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.account-card__header {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
}

.account-card__spotify {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-decoration: none;
  color: inherit;
}

.account-card__edit {
  flex-shrink: 0;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-decoration: none;
  color: inherit;
  outline: none;
}

.account-card__edit img {
  margin-right: 0;
  flex-shrink: 0;
}

.account-card__edit:hover,
.account-card__edit:focus-visible {
  text-decoration: underline;
}

.account-card--hot .account-card__meta {
  color: rgba(255, 255, 255, 0.88);
}

.account-card.account-card--more {
  flex: 1 0 12rem;
  width: auto;
  min-width: 12rem;
  max-width: none;
  margin-right: 0;
  box-sizing: border-box;
  cursor: pointer;
  justify-content: center;
  text-align: center;
  outline: none;
  justify-content: flex-end;
  align-items: flex-start;
}

.account-card--more:hover .account-card__label--more,
.account-card--more:focus-visible .account-card__label--more,
.account-card--more.account-card--hot .account-card__label--more {
  text-decoration: underline;
}

.account-card--more[aria-busy='true'] {
  opacity: 0.7;
  cursor: wait;
  pointer-events: none;
}

.account-card__cover {
  width: 6.5rem;
  height: 6.5rem;
  border: 1px solid #000;
  overflow: hidden;
  background: #f4f4f4;
}

.account-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.account-card__cover-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.5rem;
  color: #999;
}

.account-card__label {
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.account-card__label--more {
  display: flex;
  flex-direction: row;
  gap: .4rem;
  -webkit-line-clamp: 4;
  line-clamp: 4;
}

.account-card__meta {
  font-size: 0.65rem;
  color: #555;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* osu! — liste scrollable */
.account-beatlist {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
}

.account-beatrow__link {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 1rem 1rem;
  gap: 1rem;
  text-decoration: none;
  color: #000;
  background-color: #fff;
  border-top: 1px solid #000;
  font-weight: 400;
  outline: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.account-beatrow__link--hot .beatrow-separator {
  background: rgba(255, 255, 255, 0.9);
}

.account-beatrow__link--hot .account-beatrow__artist,
.account-beatrow__link--hot .account-beatrow__count {
  color: rgba(255, 255, 255, 0.92);
}

.account-beatrow__title-group,
.account-beatrow__artist-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.account-beatrow__title-group {
  flex: 42 1 0;
}

.account-beatrow__artist-group {
  flex: 38 1 0;
}

.account-beatrow__title {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.82rem;
  line-height: 1.2;
}

.beatrow-separator {
  flex: 1 1 0;
  min-width: 0;
  height: 1px;
  background: #000;
}

.account-beatrow__artist {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.72rem;
  color: #444;
}

.account-beatrow__count {
  flex: 0 0 auto;
  font-size: 0.72rem;
  color: #333;
  font-variant-numeric: tabular-nums;
}

footer.account-footer {
  flex-shrink: 0;
  padding: 0.45rem 1rem 0.65rem;
  text-align: center;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  color: #555;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  margin-right: 200px;
  border-top: 1px solid #000;
  border-right: 1px solid #000;
  border-radius: 0 40px 0 0 ;
  padding: 20px 100px;

  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  text-align: left;
}

.footer-logo {
  max-width: 75px;
}
</style>
