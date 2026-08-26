<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QrcodeVue from 'qrcode.vue'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const route = useRoute()
const router = useRouter()

const order = ref<any>(null)
const loading = ref(true)

const currentTicketIndex = ref(0)
const flattenedTickets = computed(() => {
  return order.value?.tickets || []
})

async function fetchOrder() {
  const orderId = route.query.orderId as string
  const email = route.query.email as string
  const accessPin = route.query.accessPin as string
  
  if (!orderId) { router.push('/'); return }
  
  try {
    // Intentamos recuperar desde localStorage primero (flujo normal checkout)
    const cached = localStorage.getItem(`order_success_${orderId}`)
    if (cached) {
      order.value = JSON.parse(cached)
      return
    }
    
    // Si hay credenciales, llamamos al backend
    if (email && accessPin) {
      const response = await fetch(`${BASE_URL}/orders/${orderId}?email=${encodeURIComponent(email)}&accessPin=${encodeURIComponent(accessPin)}`)
      if (response.ok) {
        order.value = await response.json()
        return
      } else {
        throw new Error('No autorizado')
      }
    }
    
    // Si no hay caché ni credenciales, redirigimos al flujo de recuperación
    router.push('/recover')
  } catch (e) {
    alert('Orden no encontrada o credenciales inválidas')
    router.push('/recover')
  } finally {
    loading.value = false
  }
}

function prevTicket() {
  if (currentTicketIndex.value > 0) currentTicketIndex.value--
}
function nextTicket() {
  if (currentTicketIndex.value < flattenedTickets.value.length - 1) currentTicketIndex.value++
}

function downloadPDF() {
  if (!order.value) return
  const email = encodeURIComponent(order.value.clientEmail || order.value.email || '')
  const pin = encodeURIComponent(order.value.accessPin)
  window.open(`${BASE_URL}/orders/${(order.value.id || order.value.orderId)}/pdf?email=${email}&accessPin=${pin}`, '_blank')
}

onMounted(() => { fetchOrder() })
</script>

<template>
  <div class="min-h-screen bg-[#131313] text-white flex flex-col md:flex-row">
    
    <div v-if="loading" class="flex flex-1 items-center justify-center">
      <div class="animate-pulse text-violet-400 font-bold text-xl">Cargando Boletos...</div>
    </div>

    <template v-else-if="order">
      <!-- Panel Izquierdo -->
      <div class="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center border-r border-gray-800">
        <div class="bg-green-900/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-full inline-flex items-center gap-2 mb-8 self-start text-sm font-bold">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
          Boletos Activos
        </div>

        <h1 class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-white mb-6">
          ¡Tus Boletos están listos!
        </h1>
        
        <p class="text-gray-400 text-lg mb-8 leading-relaxed">
          Escanea el código QR en la puerta de acceso. No necesitas imprimirlo, puedes mostrarlo desde tu teléfono.
        </p>

        <!-- PIN de Seguridad -->
        <div class="bg-[#1a1a1a] p-6 rounded-2xl border-2 border-violet-600/50 shadow-[0_0_30px_rgba(139,92,246,0.1)] mb-8">
          <p class="text-sm text-violet-300 font-semibold uppercase tracking-wider mb-2">Tu PIN de Recuperación (Guárdalo)</p>
          <div class="flex items-center gap-4">
            <div class="text-4xl font-black text-white tracking-widest font-mono bg-black px-6 py-3 rounded-xl border border-gray-800">
              {{ order.accessPin }}
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-4">
            Si cierras esta pestaña, necesitarás tu correo ({{ order.clientEmail || order.email }}) y este PIN para recuperar tus boletos. Puedes guardar este enlace en favoritos.
          </p>
        </div>

        <button @click="downloadPDF" class="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-3 text-lg">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Descargar PDF (Todos los Boletos)
        </button>
      </div>

      <!-- Panel Derecho: Carrusel -->
      <div class="w-full md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center bg-black relative">
        <div class="absolute top-8 right-8 bg-gray-900 px-4 py-2 rounded-full text-sm font-bold text-gray-400 border border-gray-800">
          Boleto {{ currentTicketIndex + 1 }} de {{ flattenedTickets.length }}
        </div>

        <div class="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all duration-300">
          <div class="bg-violet-600 p-6 text-center text-white">
            <h2 class="text-xl font-black uppercase tracking-wider">Entrada</h2>
            <p class="text-violet-200 text-xs mt-1 font-mono opacity-80">Boleto #{{ currentTicketIndex + 1 }}</p>
          </div>
          <div class="p-8 flex flex-col items-center bg-gray-50">
            <div class="w-48 h-48 bg-white border-4 border-white shadow-sm rounded-lg overflow-hidden flex items-center justify-center mb-6 p-2">
              <QrcodeVue v-if="flattenedTickets[currentTicketIndex]?.signature" :value="JSON.stringify({ ticketId: flattenedTickets[currentTicketIndex].id, signature: flattenedTickets[currentTicketIndex].signature })" :size="180" level="H" />
              <div v-else class="text-gray-400 text-xs text-center">QR pendiente</div>
            </div>
            <div class="w-full border-t-2 border-dashed border-gray-300 my-2"></div>
            <p class="text-xs text-gray-400 font-mono text-center mt-4 uppercase">ID: {{ flattenedTickets[currentTicketIndex]?.id?.split('-')[0] }}</p>
            <p class="text-[10px] text-gray-400 text-center mt-1 uppercase font-bold">TicketRush</p>
          </div>
        </div>

        <div class="flex items-center gap-6 mt-10">
          <button @click="prevTicket" :disabled="currentTicketIndex === 0" class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-violet-600 disabled:opacity-30 disabled:hover:bg-gray-800 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div class="flex gap-2">
            <div v-for="(_, index) in flattenedTickets" :key="index" :class="['w-2 h-2 rounded-full transition-all duration-300', currentTicketIndex === index ? 'bg-violet-500 w-6' : 'bg-gray-700']"></div>
          </div>
          <button @click="nextTicket" :disabled="currentTicketIndex === flattenedTickets.length - 1" class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-violet-600 disabled:opacity-30 disabled:hover:bg-gray-800 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
