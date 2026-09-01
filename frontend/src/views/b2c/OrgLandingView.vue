<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tenantId = route.params.tenantId as string

const events = ref<any[]>([])
const loading = ref(true)
const errorMsg = ref('')
const tenantInfo = ref<any>({ name: tenantId.replace(/-/g, ' ').toUpperCase(), brandColor: '#8b5cf6' })

const currentTab = ref<'upcoming' | 'past'>('upcoming')
const currentPage = ref(1)
const totalItems = ref(0)
const totalPages = ref(1)
const limit = 6

async function loadStoreEvents(page = 1) {
  loading.value = true
  try {
    const res = await fetch(`${BASE_URL}/public/tenants/${tenantId}/events?page=${page}&limit=${limit}&status=${currentTab.value}`)
    if (!res.ok) throw new Error('No se pudieron cargar los eventos.')
    const data = await res.json()
    events.value = data.data
    totalItems.value = data.total
    currentPage.value = data.page
    totalPages.value = Math.ceil(data.total / limit)
  } catch(e: any) {
    errorMsg.value = e.message || 'Error desconocido'
  } finally {
    loading.value = false
  }
}

async function changeTab(tab: 'upcoming' | 'past') {
  currentTab.value = tab
  currentPage.value = 1
  await loadStoreEvents(1)
}

async function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return
  await loadStoreEvents(page)
}

onMounted(async () => {
  if (!tenantId) {
    errorMsg.value = 'No se especificó una organización.'
    loading.value = false
    return
  }
  
  try {
    const tenantRes = await fetch(`${BASE_URL}/public/tenants/${tenantId}`)
    if (tenantRes.ok) {
      tenantInfo.value = await tenantRes.json()
      document.title = `${tenantInfo.value.name} | Eventos`
    }
    await loadStoreEvents(1)
  } catch(e: any) {
    errorMsg.value = e.message || 'Error desconocido'
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0d0d0d] text-white">

    <header class="sticky top-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-gray-800/60">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="font-black text-xl tracking-widest uppercase text-white">VANTAGE</div>
        <div class="text-sm text-gray-400 hidden md:block font-mono">{{ tenantInfo.name }}</div>
      </div>
    </header>

    <div class="bg-[#141414] border-b border-gray-800 relative overflow-hidden">
      <!-- Fondo por defecto con gradiente -->
      <div v-if="!tenantInfo.bannerUrl" class="absolute inset-0 opacity-20" :style="`background: radial-gradient(circle at 50% -20%, ${tenantInfo.brandColor}, transparent 70%)`"></div>
      <!-- Imagen Banner del Tenant -->
      <img v-else :src="tenantInfo.bannerUrl" class="absolute inset-0 w-full h-full object-cover opacity-20" />
      <div v-if="tenantInfo.bannerUrl" class="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent"></div>
      <div class="max-w-6xl mx-auto px-6 py-20 relative flex flex-col items-center text-center">
        <div class="w-32 h-32 rounded-full border-4 border-black bg-black flex items-center justify-center text-5xl font-black mb-6 overflow-hidden" :style="`color: ${tenantInfo.brandColor}`">
          <img v-if="tenantInfo.logoUrl" :src="tenantInfo.logoUrl" alt="Logo" class="w-full h-full object-cover" />
          <span v-else>{{ tenantInfo.name.charAt(0) }}</span>
        </div>
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black break-words tracking-tighter uppercase mb-4">{{ tenantInfo.name }}</h1>
        <p class="text-gray-400 text-lg md:text-xl max-w-2xl font-medium">Boutique de eventos y experiencias premium.</p>
        
        <div v-if="authStore.isAuthenticated && authStore.user?.tenantId === tenantId" class="mt-8">
          <button @click="router.push('/b2b')" class="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:scale-105 border border-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Volver al Dashboard B2B
          </button>
        </div>
      </div>
    </div>

    <main class="max-w-6xl mx-auto px-6 py-12">

      <div class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 class="text-3xl font-black text-white uppercase tracking-tight">Catálogo</h2>
          <div class="w-24 h-1 mt-4" :style="`background-color: ${tenantInfo.brandColor}`"></div>
        </div>
        
        <div class="flex items-center gap-2 bg-[#111] p-1 rounded-lg border border-gray-800">
          <button 
            @click="changeTab('upcoming')"
            class="px-6 py-2 rounded-md text-sm font-bold transition-colors"
            :class="currentTab === 'upcoming' ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
            :style="currentTab === 'upcoming' ? `background-color: ${tenantInfo.brandColor}` : ''"
          >
            Próximos
          </button>
          <button 
            @click="changeTab('past')"
            class="px-6 py-2 rounded-md text-sm font-bold transition-colors"
            :class="currentTab === 'past' ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
            :style="currentTab === 'past' ? `background-color: ${tenantInfo.brandColor}` : ''"
          >
            Pasados
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" :style="`border-color: ${tenantInfo.brandColor}`"></div>
      </div>

      <div v-else-if="errorMsg" class="text-center py-32">
        <p class="text-red-400 font-bold text-xl">{{ errorMsg }}</p>
      </div>

      <div v-else-if="events.length === 0" class="text-center py-24 bg-[#141414] rounded-2xl border border-gray-800">
        <svg class="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        <h3 class="text-xl font-bold text-gray-400">No hay eventos {{ currentTab === 'upcoming' ? 'próximos' : 'pasados' }}</h3>
        <p class="text-gray-600 mt-2">{{ currentTab === 'upcoming' ? 'Pronto anunciaremos nuevas fechas.' : 'Aún no se ha realizado ningún evento.' }}</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article 
          v-for="event in events" 
          :key="event.id"
          @click="router.push(`/e/${event.id}`)"
          class="group bg-[#141414] rounded-2xl overflow-hidden border border-gray-800/80 hover:border-gray-600 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col"
        >
          <div class="h-48 relative overflow-hidden bg-gray-900">
            <div class="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent z-10"></div>
            <img 
              :src="event.bannerUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-100 mix-blend-screen" 
            />
            <div class="absolute top-4 left-4 z-20">
              <span class="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 uppercase tracking-widest">
                {{ new Date(event.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) }}
              </span>
            </div>
          </div>
          
          <div class="p-6 flex-1 flex flex-col">
            <h3 class="text-2xl font-black text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text" :style="`background-image: linear-gradient(to right, white, ${tenantInfo.brandColor})`">
              {{ event.name }}
            </h3>
            <div class="flex items-center gap-2 text-gray-400 text-sm mb-6 mt-auto">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span class="truncate">{{ event.location }}</span>
            </div>
            <div class="flex items-center justify-between pt-4 border-t border-gray-800/80">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Entradas desde</span>
              <span class="text-lg font-black" :style="`color: ${tenantInfo.brandColor}`">
                Ver info
              </span>
            </div>
          </div>
        </article>
      </div>

      <div v-if="totalPages > 1 && !loading" class="mt-12 flex justify-center items-center gap-4">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="p-2 rounded-lg bg-[#1a1a1a] border border-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <span class="text-sm font-medium text-gray-400">
          Página <span class="text-white">{{ currentPage }}</span> de {{ totalPages }}
        </span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="p-2 rounded-lg bg-[#1a1a1a] border border-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </main>

  </div>
</template>
