<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { EventService } from '../../services/event.service'

const router = useRouter()
const events = ref<any[]>([])
const loading = ref(true)

// Métricas Falsas para el Dashboard
const metrics = ref({
  totalRevenue: '$12,450.00',
  ticketsSold: '342',
  conversionRate: '4.2%'
})

async function fetchEvents() {
  loading.value = true
  try {
    const data: any = await EventService.listEvents()
    events.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <div class="max-w-6xl mx-auto pb-12">
    <!-- Header del Dashboard -->
    <div class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-3xl font-bold text-white tracking-tight">Dashboard de Eventos</h2>
        <p class="text-gray-400 text-sm mt-1">Resumen general y acceso rápido a tu catálogo.</p>
      </div>
      <button @click="router.push('/b2b/events/new')" class="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2.5 rounded-lg shadow-lg shadow-violet-900/20 transition-all flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        Crear Evento
      </button>
    </div>

    <!-- Top Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 class="text-gray-400 text-sm font-medium mb-1">Ingresos Totales (USD)</h3>
        <p class="text-3xl font-bold text-white">{{ metrics.totalRevenue }}</p>
        <span class="text-xs text-green-400 font-medium mt-2 block">+14% vs mes anterior</span>
      </div>
      <div class="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 class="text-gray-400 text-sm font-medium mb-1">Tickets Vendidos</h3>
        <p class="text-3xl font-bold text-white">{{ metrics.ticketsSold }}</p>
        <span class="text-xs text-green-400 font-medium mt-2 block">+5% vs mes anterior</span>
      </div>
      <div class="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 class="text-gray-400 text-sm font-medium mb-1">Tasa de Conversión</h3>
        <p class="text-3xl font-bold text-white">{{ metrics.conversionRate }}</p>
        <span class="text-xs text-red-400 font-medium mt-2 block">-1.2% vs mes anterior</span>
      </div>
    </div>

    <!-- Event List Section -->
    <h3 class="text-xl font-bold text-white mb-4">Eventos Activos</h3>
    
    <div class="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden shadow-sm">
      <div v-if="loading" class="p-12 text-center text-gray-500 animate-pulse">Cargando catálogo...</div>
      
      <table v-else class="w-full text-left border-collapse">
        <thead class="bg-[#131313] text-xs uppercase text-gray-500 border-b border-gray-800">
          <tr>
            <th class="px-6 py-4 font-semibold tracking-wider">Detalles del Evento</th>
            <th class="px-6 py-4 font-semibold tracking-wider">Ubicación</th>
            <th class="px-6 py-4 font-semibold tracking-wider">Fecha</th>
            <th class="px-6 py-4 font-semibold tracking-wider text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr v-for="event in events" :key="event.id" class="hover:bg-gray-800/30 transition-colors group cursor-pointer" @click="router.push(`/b2b/events/${event.id}/edit`)">
            <td class="px-6 py-5">
              <div class="font-bold text-gray-100 text-base group-hover:text-violet-400 transition-colors">{{ event.name }}</div>
              <div class="text-xs text-gray-500 font-mono mt-1 opacity-70">ID: {{ event.id }}</div>
            </td>
            <td class="px-6 py-5 text-sm text-gray-300">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {{ event.location }}
              </div>
            </td>
            <td class="px-6 py-5 text-sm text-gray-300">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {{ formatDate(event.date) }}
              </div>
            </td>
            <td class="px-6 py-5 text-right">
              <button @click.stop="router.push(`/b2b/events/${event.id}/edit`)" class="text-sm font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-4 py-2 rounded-lg transition-colors">
                Gestionar
              </button>
            </td>
          </tr>
          <tr v-if="events.length === 0">
            <td colspan="4" class="px-6 py-16 text-center">
              <div class="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h4 class="text-lg font-bold text-white mb-2">Aún no hay eventos</h4>
              <p class="text-gray-500 mb-6 max-w-sm mx-auto">Comienza a monetizar y vender entradas creando tu primer evento. Solo tomará unos minutos.</p>
              <button @click="router.push('/b2b/events/new')" class="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2.5 rounded-lg shadow-lg transition-colors">
                Crear mi primer evento
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
