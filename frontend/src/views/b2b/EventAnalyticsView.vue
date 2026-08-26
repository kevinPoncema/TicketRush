<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AnalyticsService } from '../../services/analytics.service'
import VueApexCharts from 'vue3-apexcharts'

const route = useRoute()
const router = useRouter()
const eventId = route.params.id as string

const summary = ref<any>({
  totalRevenue: 0,
  ticketsSold: 0,
  chartData: [],
  ticketsByTier: []
})
const loading = ref(true)

const chartOptions: any = {
  chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
  theme: { mode: 'dark' },
  colors: ['#3b82f6'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  xaxis: { type: 'datetime' },
  yaxis: { show: false },
  grid: { show: false }
}
const chartSeries = ref<any[]>([])

const donutOptions: any = {
  chart: { type: 'donut', background: 'transparent' },
  theme: { mode: 'dark' },
  labels: [],
  colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  dataLabels: { enabled: true }
}
const donutSeries = ref<any[]>([])

async function fetchData() {
  loading.value = true
  try {
    const data = await AnalyticsService.getEventAnalytics(eventId)
    summary.value = data
    
    if (data.chartData && data.chartData.length) {
      chartSeries.value = [{
        name: 'Ingresos',
        data: data.chartData.map((d: any) => [new Date(d.date).getTime(), parseFloat(d.amount)])
      }]
    }
    
    if (data.ticketsByTier && data.ticketsByTier.length) {
      donutOptions.labels = data.ticketsByTier.map((t: any) => t.tier) as any
      donutSeries.value = data.ticketsByTier.map((t: any) => parseInt(t.count))
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="max-w-6xl mx-auto pb-12">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <button @click="router.push('/b2b/dashboard')" class="w-10 h-10 bg-[#1a1a1a] hover:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </button>
      <div>
        <h2 class="text-3xl font-bold text-white tracking-tight">Analíticas del Evento</h2>
        <p class="text-gray-400 text-sm mt-1">Rendimiento en tiempo real.</p>
      </div>
    </div>

    <div v-if="loading" class="p-12 text-center text-gray-500 animate-pulse">Cargando métricas...</div>

    <div v-else>
      <!-- Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div class="bg-[#141414] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">TICKETS VENDIDOS</h3>
          <div class="text-5xl font-black text-white mb-2">{{ summary.ticketsSold.toLocaleString() }}</div>
          <div class="absolute top-6 right-6 opacity-20">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
          </div>
        </div>
        
        <div class="bg-[#141414] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">INGRESOS (ESTE EVENTO)</h3>
          <div class="text-5xl font-black text-white mb-2">${{ Number(summary.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
          <div class="absolute top-6 right-6 opacity-20">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Area Chart -->
        <div class="md:col-span-2 bg-[#141414] border border-gray-800 rounded-xl p-6 h-80" v-if="chartSeries.length > 0">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">INGRESOS ÚLTIMOS 7 DÍAS</h3>
          <VueApexCharts height="100%" type="area" :options="chartOptions" :series="chartSeries"></VueApexCharts>
        </div>
        <div class="md:col-span-2 bg-[#141414] border border-gray-800 rounded-xl p-6 h-80 flex items-center justify-center text-gray-500" v-else>
          No hay datos suficientes para graficar
        </div>

        <!-- Donut Chart -->
        <div class="bg-[#141414] border border-gray-800 rounded-xl p-6 h-80" v-if="donutSeries.length > 0">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">VENTAS POR TIER</h3>
          <VueApexCharts height="100%" type="donut" :options="donutOptions" :series="donutSeries"></VueApexCharts>
        </div>
        <div class="bg-[#141414] border border-gray-800 rounded-xl p-6 h-80 flex items-center justify-center text-gray-500" v-else>
          No hay tickets vendidos
        </div>
      </div>
    </div>
  </div>
</template>
