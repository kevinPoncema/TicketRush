<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MockApiService } from '../../services/api.mock'

const route = useRoute()
const router = useRouter()
const tenantId = route.params.tenantId as string

const events = ref<any[]>([])
const loading = ref(true)
const errorMsg = ref('')

onMounted(async () => {
  if (!tenantId) {
    errorMsg.value = 'No se especificó una organización.'
    loading.value = false
    return
  }
  try {
    events.value = (await MockApiService.getUpcomingEventsByTenant(tenantId)) as any[]
  } catch (e) {
    errorMsg.value = 'No se pudieron cargar los eventos.'
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function lowestPrice(tiers: any[]) {
  if (!tiers?.length) return null
  return Math.min(...tiers.map(t => Number(t.price)))
}

function scarcityLabel(tiers: any[]) {
  if (!tiers?.length) return null
  const minCapacity = Math.min(...tiers.map(t => Number(t.capacity)))
  if (minCapacity <= 20) return { label: '¡Casi Agotado!', color: 'text-red-400 animate-pulse', dot: 'bg-red-500' }
  if (minCapacity <= 50) return { label: 'Últimos Cupos', color: 'text-orange-400', dot: 'bg-orange-500' }
  return { label: 'Disponible', color: 'text-green-400', dot: 'bg-green-500' }
}

// Nombre de la organización derivado (en producción vendría del backend)
const orgName = computed(() => {
  if (tenantId.startsWith('mock')) return 'VANTAGE Productions'
  return tenantId.replace(/-/g, ' ').toUpperCase()
})
</script>

<template>
  <div class="min-h-screen bg-[#0d0d0d] text-white">

    <!-- Header -->
    <header class="sticky top-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-gray-800/60">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="font-black text-xl tracking-widest uppercase text-white">VANTAGE</div>
        <div class="text-sm text-gray-400 hidden md:block font-mono">{{ orgName }}</div>
      </div>
    </header>

    <!-- Hero de la Organización -->
    <div class="relative h-52 bg-black overflow-hidden flex items-center justify-center">
      <!-- Fondo genérico con gradiente de marca -->
      <div class="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-black to-black"></div>
      <div class="absolute inset-0 opacity-20"
        style="background-image: radial-gradient(circle at 20% 80%, rgba(139,92,246,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(167,139,250,0.2) 0%, transparent 50%)">
      </div>

      <div class="relative z-10 text-center px-4">
        <!-- Logo genérico (inicial de la org) -->
        <div class="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center mx-auto mb-4 text-2xl font-black text-violet-400 tracking-tight">
          {{ orgName.charAt(0) }}
        </div>
        <h1 class="text-3xl font-black tracking-tight text-white">{{ orgName }}</h1>
        <p class="text-gray-400 text-sm mt-1 font-mono">Eventos disponibles</p>
      </div>
    </div>

    <!-- Contenido principal -->
    <main class="max-w-6xl mx-auto px-6 py-12">

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
        <p class="text-gray-400 text-sm">Cargando experiencias...</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="text-center py-32">
        <p class="text-red-400 font-bold text-xl">{{ errorMsg }}</p>
      </div>

      <!-- Sin eventos -->
      <div v-else-if="events.length === 0" class="text-center py-32">
        <div class="text-6xl mb-6">🎟️</div>
        <h2 class="text-2xl font-bold text-white mb-3">No hay eventos próximos</h2>
        <p class="text-gray-500">Esta organización no tiene eventos programados por el momento.</p>
      </div>

      <!-- Grid de Eventos -->
      <div v-else>
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold text-white">
            {{ events.length }} evento{{ events.length !== 1 ? 's' : '' }} próximo{{ events.length !== 1 ? 's' : '' }}
          </h2>
          <span class="text-xs font-mono text-gray-500 uppercase tracking-widest">Ordenados por fecha</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="event in events"
            :key="event.id"
            @click="router.push(`/e/${event.id}`)"
            class="group bg-[#141414] border border-gray-800 hover:border-violet-500/60 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:bg-[#1a1a1a] hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] flex flex-col"
          >
            <!-- Tapa del evento (imagen genérica + overlay) -->
            <div class="relative h-44 bg-black overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
                class="w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                alt=""
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>

              <!-- Badge días restantes -->
              <div class="absolute top-3 left-3">
                <div
                  class="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  :class="daysUntil(event.date) <= 14 ? 'bg-violet-600 text-white' : 'bg-gray-800/90 text-gray-300'"
                >
                  {{ daysUntil(event.date) === 0 ? '¡HOY!' : `En ${daysUntil(event.date)} días` }}
                </div>
              </div>

              <!-- Scarcity badge -->
              <div v-if="scarcityLabel(event.tiers)" class="absolute top-3 right-3">
                <div class="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <div class="w-1.5 h-1.5 rounded-full" :class="scarcityLabel(event.tiers)?.dot"></div>
                  <span class="text-xs font-bold" :class="scarcityLabel(event.tiers)?.color">
                    {{ scarcityLabel(event.tiers)?.label }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Contenido de la tarjeta -->
            <div class="p-6 flex flex-col flex-1">
              <h3 class="text-lg font-black text-white uppercase tracking-tight leading-tight mb-3 group-hover:text-violet-300 transition-colors">
                {{ event.name }}
              </h3>

              <div class="space-y-2 mb-4 flex-1">
                <div class="flex items-center gap-2 text-gray-400 text-sm">
                  <svg class="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span class="capitalize">{{ formatDate(event.date) }}</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400 text-sm">
                  <svg class="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span>{{ event.location }}</span>
                </div>
              </div>

              <!-- Footer de la tarjeta -->
              <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                <div>
                  <span class="text-xs text-gray-500 uppercase tracking-wider">Desde</span>
                  <div class="text-xl font-black text-white">
                    ${{ lowestPrice(event.tiers)?.toFixed(2) }}
                  </div>
                </div>
                <div class="bg-violet-600 group-hover:bg-violet-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
                  Ver Evento
                  <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- Footer mínimo -->
    <footer class="border-t border-gray-800/50 py-8 mt-12">
      <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <span class="text-gray-600 text-xs font-mono uppercase tracking-widest">Powered by VANTAGE Ticketing</span>
        <div class="flex gap-6 text-xs text-gray-600">
          <a href="#" class="hover:text-gray-400 transition-colors">Privacidad</a>
          <a href="#" class="hover:text-gray-400 transition-colors">Términos</a>
          <a href="#" class="hover:text-gray-400 transition-colors">Soporte</a>
        </div>
      </div>
    </footer>

  </div>
</template>
