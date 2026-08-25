<script setup lang="ts">
import { ref } from 'vue'

const message = ref('TicketRush Frontend Operativo')
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
    <h1 class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
      {{ message }}
    </h1>
    <p class="mt-4 text-gray-400">Vue 3 + Vite + TailwindCSS v4 + Pinia</p>
  </div>
</template>
