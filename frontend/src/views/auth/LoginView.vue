<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    await authStore.login(form.value)
    const redirectPath = route.query.redirect as string
    router.push(redirectPath || '/b2b')
  } catch (e) {
    alert('Credenciales inválidas')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-[#1a1a1a] p-8 rounded-2xl border border-gray-800 shadow-2xl">
      <h2 class="text-3xl font-bold mb-2">Bienvenido de vuelta</h2>
      <p class="text-gray-400 mb-8">Ingresa a tu panel de control de VANTAGE.</p>

      <form @submit.prevent="submit" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
          <input v-model="form.email" required type="email" class="w-full bg-[#131313] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors" placeholder="admin@ravecorp.com">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
          <input v-model="form.password" required type="password" class="w-full bg-[#131313] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors" placeholder="••••••••">
        </div>

        <button :disabled="loading" type="submit" class="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center">
          <span v-if="loading" class="animate-pulse">Ingresando...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>

      <p class="mt-6 text-center text-gray-500 text-sm">
        ¿Eres un organizador nuevo? <router-link to="/auth/register" class="text-violet-400 hover:text-violet-300">Regístrate</router-link>
      </p>
    </div>
  </div>
</template>
