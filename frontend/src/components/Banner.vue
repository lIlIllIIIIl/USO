<template>
  <nav class="navbar">
    <router-link to="/" class="logo">
      <img src="../assets/uso.svg" alt="USO" class="logo-img" />
    </router-link>
    <div class="nav-links">
      <div class="link-background">
        <a
          href="#"
          :class="['left', color]"
          role="button"
          @click.prevent="toggleMenu"
          @mouseenter="mouseChange"
          @mouseleave="mouseChange"
        >
          Menu
        </a>
        <img src="../assets/menu.svg" alt="" aria-hidden="true" />
      </div>
    </div>
    <FullScreenMenu
      :open="menuOpen"
      @close="menuOpen = false"
      @osu="onOsuMenu"
      @account="goAccount"
      @logout="onLogoutMenu"
    />
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import FullScreenMenu from './FullScreenMenu.vue';

const router = useRouter();

const colorTab = ['vert', 'bleu', 'rose', 'orange', 'jaune'];
const color = ref('vert');
const oldColor = ref(0);
const hovered = ref(false);
const menuOpen = ref(false);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function doColor() {
  if (!hovered.value) return;
  let colorValue = Math.floor(Math.random() * colorTab.length);
  if (colorValue === oldColor.value) {
    colorValue = Math.floor(Math.random() * colorTab.length);
  }
  color.value = colorTab[colorValue];
  oldColor.value = colorValue;
}

function mouseChange() {
  hovered.value = !hovered.value;
  doColor();
}

function onOsuMenu() {
  /* comportement OSU à définir */
}

function goAccount() {
  menuOpen.value = false;
  router.push({ name: 'account' });
}

function onLogoutMenu() {
  /* déconnexion à définir */
}

onMounted(() => {
  doColor();
});
</script>

<style scoped>
.logo-img {
  height: 2rem;
  width: auto;
}
</style>
