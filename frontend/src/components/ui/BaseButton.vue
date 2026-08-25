<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  type?: 'button' | 'submit'
}>()
</script>

<template>
  <button
    :type="type || 'button'"
    :disabled="loading"
    :class="[
      'px-6 py-2 rounded-lg font-medium transition-colors flex justify-center items-center',
      variant === 'secondary' ? 'bg-gray-800 hover:bg-gray-700 text-white' :
      variant === 'danger' ? 'bg-red-900/50 hover:bg-red-600 text-red-100' :
      'bg-violet-600 hover:bg-violet-500 text-white',
      loading ? 'opacity-70 cursor-not-allowed' : ''
    ]"
  >
    <span v-if="loading" class="animate-pulse">Cargando...</span>
    <slot v-else />
  </button>
</template>
