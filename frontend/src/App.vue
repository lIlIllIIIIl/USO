<template>
  <div class="App">
    <div v-if="!isDesktop" class="desktop-only-message">
      <p class="desktop-only-message__title">USO</p>
      <p class="desktop-only-message__text">
        Ce site est conçu pour être utilisé sur ordinateur (écran desktop).
      </p>
      <p class="desktop-only-message__hint">
        Ouvrez-le sur un écran plus large pour continuer.
      </p>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const DESKTOP_BREAKPOINT = 840;

const isDesktop = ref(true); /* initialisé à true pour éviter flash mobile au premier paint */

function checkViewport() {
  isDesktop.value = window.innerWidth >= DESKTOP_BREAKPOINT;
}

onMounted(() => {
  checkViewport();
  window.addEventListener('resize', checkViewport);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkViewport);
});
</script>

<style scoped>
.App {
  height: 100vh;
}

.desktop-only-message {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
}

.desktop-only-message__title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
  letter-spacing: 0.05em;
}

.desktop-only-message__text {
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 0.5rem;
  max-width: 320px;
}

.desktop-only-message__hint {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}
</style>
