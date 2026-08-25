<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const orders = ref<any[]>([])

onMounted(() => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('order_success_'))
  
  if (keys.length === 0) {
    router.push('/recover')
    return
  }

  orders.value = keys.map(k => {
    try { const o = JSON.parse(localStorage.getItem(k) || '{}'); o.orderId = o.id || o.orderId; return o; } catch { return null }
  }).filter(o => o && o.orderId).sort((a, b) => b.orderId.localeCompare(a.orderId))
})

function viewOrder(orderId: string) {
  router.push(`/success?orderId=${orderId}`)
}
</script>

<template>
  <div class="min-h-screen bg-[#131313] text-white pt-12 pb-24 px-4">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-white">Mi Billetera</h1>
          <p class="text-gray-400 mt-1">Tus accesos guardados en este dispositivo.</p>
        </div>
        <button @click="router.push('/recover')" class="text-sm font-medium text-violet-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
          Recuperar otros
        </button>
      </div>

      <div class="space-y-4">
        <div 
          v-for="order in orders" 
          :key="order.orderId" 
          @click="viewOrder(order.orderId)"
          class="bg-[#1a1a1a] border border-gray-800 hover:border-violet-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:bg-gray-800 group"
        >
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-violet-600/20 text-violet-400 rounded-xl flex items-center justify-center font-bold text-xl group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">{{ order.eventName || 'Evento VANTAGE' }}</h2>
                <p class="text-sm text-gray-500 font-mono mt-1">ORDEN: {{ order.orderId }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div class="text-right">
                <p class="text-xs text-gray-500 uppercase font-bold">Estado</p>
                <div class="flex items-center gap-1 mt-0.5">
                  <div class="w-2 h-2 rounded-full bg-green-500"></div>
                  <span class="text-sm font-semibold text-green-400">PAGADO</span>
                </div>
              </div>
              <svg class="w-5 h-5 text-gray-600 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
