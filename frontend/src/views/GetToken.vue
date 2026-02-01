<template>
  <div class="display-none">It's working</div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  localStorage.setItem('userToken', token || 'error');
  router.replace('/playlist-creator');
});
</script>
