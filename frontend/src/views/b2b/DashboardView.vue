<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function logout() {
  authStore.logout()
  router.push('/auth/login')
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
      <div class="p-6">
        <h1 class="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">
          VANTAGE
        </h1>
        <p class="text-xs text-gray-500 mt-1 uppercase tracking-widest">B2B Dashboard</p>
      </div>

      <nav class="flex-1 px-4 space-y-2 mt-4">
        <router-link to="/b2b" class="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors" exact-active-class="bg-gray-800 text-white font-medium">
          Resumen
        </router-link>
        <router-link to="/b2b/events" class="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors" active-class="bg-gray-800 text-white font-medium">
          Gestionar Eventos
        </router-link>
        <router-link to="/b2b/staff" class="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors" active-class="bg-gray-800 text-white font-medium">
          Gestión de Staff
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-800">
        <div class="text-sm font-medium mb-1 truncate">{{ authStore.user?.email }}</div>
        <div class="text-xs text-gray-500 mb-4">{{ authStore.user?.role }}</div>
        <button @click="logout" class="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors">
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8 overflow-y-auto">
      <router-view v-if="$route.path !== '/b2b'" />
      
      <div v-else>
        <h2 class="text-3xl font-bold mb-6">Bienvenido a VANTAGE</h2>
        <p class="text-gray-400">Selecciona "Gestión de Staff" o "Gestionar Eventos" en el menú izquierdo para administrar tu organización.</p>
      </div>
    </main>
  </div>
</template>
