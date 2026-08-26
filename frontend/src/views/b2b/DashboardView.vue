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
          Mis Eventos
        </router-link>
                <router-link to="/b2b/staff" class="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors" active-class="bg-gray-800 text-white font-medium">
          Gestión de Staff
        </router-link>
      <router-link to="/b2b/integrations" class="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors" active-class="bg-gray-800 text-white font-medium">
          Configuraciones
        </router-link>

        <div class="pt-4 mt-4 border-t border-gray-800"></div>

        <router-link :to="'/org/' + authStore.user?.tenantId" target="_blank" class="block px-4 py-2 text-sm font-bold text-violet-400 hover:bg-violet-900/30 hover:text-violet-300 rounded-lg transition-colors flex items-center justify-between">
          <span>Ver mi Tienda</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </router-link>
            <router-link to="/scanner" class="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors flex items-center gap-2 mt-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          Modo Escáner (QR)
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
      <router-view />
    </main>
  </div>
</template>
