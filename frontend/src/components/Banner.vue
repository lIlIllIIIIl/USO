<template>
  <nav class="navbar">
    <router-link to="/" class="logo">
      <img src="../assets/uso.svg" alt="USO" class="logo-img" />
    </router-link>
    <!-- Menu (désactivé, à réactiver si besoin)
    <div class="nav-links">
      <div class="link-background">
        <router-link
          :class="['left', color]"
          to="/"
          @mouseenter="mouseChange"
          @mouseleave="mouseChange"
        >
          Menu
        </router-link>
        <img src="../assets/menu.svg" alt="Menu" />
      </div>
    </div>
    -->
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const colorTab = ['vert', 'bleu', 'rose', 'orange', 'jaune'];
const color = ref('vert');
const oldColor = ref(0);
const hovered = ref(false);

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
