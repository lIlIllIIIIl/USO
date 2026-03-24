<template>
  <Teleport to="body">
    <Transition name="menu-fade">
      <div
        v-if="open"
        class="full-screen-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div class="full-screen-menu__backdrop" @click="emit('close')" />
        <div class="full-screen-menu__content" @click.stop>
          <button
            type="button"
            class="full-screen-menu__close"
            aria-label="Fermer le menu"
            @click="emit('close')"
          >
            ×
          </button>
          <nav class="full-screen-menu__nav" aria-label="Navigation principale">
            <button
              type="button"
              class="full-screen-menu__btn"
              :style="buttonStyle('osu')"
              @mouseenter="onBtnEnter('osu')"
              @mouseleave="onBtnLeave"
              @click="handleOsu"
            >
              OSU
            </button>
            <button
              type="button"
              class="full-screen-menu__btn"
              :style="buttonStyle('account')"
              @mouseenter="onBtnEnter('account')"
              @mouseleave="onBtnLeave"
              @click="handleAccount"
            >
              Compte
            </button>
            <button
              type="button"
              class="full-screen-menu__btn"
              :style="buttonStyle('logout')"
              @mouseenter="onBtnEnter('logout')"
              @mouseleave="onBtnLeave"
              @click="handleLogout"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const BG_PALETTE = ['#3db372', '#4a7df2', '#f31eeb', '#fd7e40', '#f9b125'];

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'osu', 'account', 'logout']);

const hoveredKey = ref(null);
const hoverBgByKey = ref({ osu: '', account: '', logout: '' });
let lastPickedIndex = -1;

function pickDistinctColor() {
  if (BG_PALETTE.length < 2) return BG_PALETTE[0];
  let idx = Math.floor(Math.random() * BG_PALETTE.length);
  if (idx === lastPickedIndex) {
    idx = (idx + 1) % BG_PALETTE.length;
  }
  lastPickedIndex = idx;
  return BG_PALETTE[idx];
}

function onBtnEnter(key) {
  hoverBgByKey.value = { ...hoverBgByKey.value, [key]: pickDistinctColor() };
  hoveredKey.value = key;
}

function onBtnLeave() {
  hoveredKey.value = null;
}

function buttonStyle(key) {
  if (hoveredKey.value !== key) return {};
  const bg = hoverBgByKey.value[key];
  return bg ? { backgroundColor: bg, color: '#fff' } : {};
}

function handleOsu() {
  emit('osu');
}

function handleAccount() {
  emit('account');
}

function handleLogout() {
  emit('logout');
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (!isOpen) {
      hoveredKey.value = null;
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.35s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}

.full-screen-menu {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.full-screen-menu__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.94);
  cursor: pointer;
}

.full-screen-menu__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 28rem;
  padding: 2rem;
}

.full-screen-menu__close {
  position: absolute;
  top: -0.5rem;
  right: 0.5rem;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid #000;
  border-radius: 50%;
  background: #fff;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.full-screen-menu__close:hover {
  background: #f5f5f5;
}

.full-screen-menu__nav {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.full-screen-menu__btn {
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: 1.25rem 1.5rem;
  border: 1px solid #000;
  border-radius: 50px;
  background: #fff;
  color: #000;
  font-family:
    Degular,
    system-ui,
    -apple-system,
    sans-serif;
  font-weight: 600;
  font-size: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.full-screen-menu__btn:hover {
  border-color: #000;
}
</style>
