<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { EventService } from '../../services/event.service'
import { AnalyticsService } from '../../services/analytics.service'
import VueApexCharts from 'vue3-apexcharts'

const router = useRouter()
const events = ref<any[]>([])
const summary = ref<any>({
  totalRevenue: 0,
  ticketsSold: 0,
  activeEvents: 0,
  chartData: []
})
const loading = ref(true)

const chartOptions: any = {
  chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
  theme: { mode: 'dark' },
  colors: ['#8b5cf6'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  xaxis: { type: 'datetime' },
  yaxis: { show: false },
  grid: { show: false }
}
const chartSeries = ref<any[]>([])

async function fetchData() {
  loading.value = true
  try {
    const [eventsData, analyticsData] = await Promise.all([
      EventService.listEvents(),
      AnalyticsService.getSummary()
    ])
    events.value = eventsData as any[]
    summary.value = analyticsData
    
    if (analyticsData.chartData && analyticsData.chartData.length) {
      chartSeries.value = [{
        name: 'Ingresos',
        data: analyticsData.chartData.map((d: any) => [new Date(d.date).getTime(), parseFloat(d.amount)])
      }]
    } else {
      chartSeries.value = [{ name: 'Ingresos', data: [] }]
    }
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
  fetchData()
})
</script>

<template>
  <div class="max-w-6xl mx-auto pb-12">
    <!-- Header del Dashboard -->
    <div class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-4xl font-black text-white tracking-tight">Overview</h2>
        <p class="text-gray-400 text-sm mt-1">Performance metrics across all active events.</p>
      </div>
      <button @click="router.push('/b2b/events/new')" class="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2.5 rounded-lg shadow-lg shadow-violet-900/20 transition-all flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        Crear Evento
      </button>
    </div>

    <!-- Analytics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="bg-[#141414] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">TOTAL SOLD</h3>
        <div class="text-5xl font-black text-white mb-2">{{ summary.ticketsSold.toLocaleString() }}</div>
        <div class="text-sm font-semibold text-green-400 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          Métricas al día
        </div>
        <div class="absolute top-6 right-6 opacity-20">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
        </div>
      </div>
      
      <div class="bg-[#141414] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">TOTAL REVENUE</h3>
        <div class="text-5xl font-black text-white mb-2">${{ Number(summary.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
        <div class="text-sm font-semibold text-green-400 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          Ingresos generados
        </div>
        <div class="absolute top-6 right-6 opacity-20">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      </div>

      <div class="bg-[#141414] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">ACTIVE EVENTS</h3>
        <div class="text-5xl font-black text-white mb-2">{{ summary.activeEvents.toString().padStart(2, '0') }}</div>
        <div class="text-sm font-semibold text-gray-400">Stable capacity</div>
        <div class="absolute top-6 right-6 opacity-20">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="bg-[#141414] border border-gray-800 rounded-xl p-6 mb-10 h-72" v-if="chartSeries[0]?.data?.length > 0">
      <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">REVENUE LAST 7 DAYS</h3>
      <VueApexCharts height="100%" type="area" :options="chartOptions" :series="chartSeries"></VueApexCharts>
    </div>

    <!-- Event List Section -->
    <h3 class="text-xl font-bold text-white mb-4">Event Roster</h3>
    
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
              <div class="flex justify-end gap-2">
                <a @click.stop :href="`/e/${event.id}`" target="_blank" class="text-sm font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-1">
                  Tienda
                </a>
                <button @click.stop="router.push(`/b2b/events/${event.id}/analytics`)" class="text-sm font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-lg transition-colors">
                  Analíticas
                </button>
                <button @click.stop="router.push(`/b2b/events/${event.id}/edit`)" class="text-sm font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-4 py-2 rounded-lg transition-colors">
                  Editar
                </button>
              </div>
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
