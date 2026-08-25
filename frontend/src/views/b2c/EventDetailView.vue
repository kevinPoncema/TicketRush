<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { EventService } from '../../services/event.service'

const router = useRouter()
const route = useRoute()

const event = ref<any>(null)
const loading = ref(true)

// Cantidades seleccionadas por tier (tierId -> quantity)
const selections = ref<Record<string, number>>({})

async function loadEvent() {
  try {
    const id = route.params.id as string
    const data: any = await EventService.getEvent(id)
    event.value = data
    // Inicializar contadores en 0
    data.tiers.forEach((t: any) => {
      selections.value[t.id] = 0
    })
  } catch (e) {
    alert('Evento no encontrado')
    router.push('/')
  } finally {
    loading.value = false
  }
}

function updateQuantity(tierId: string, delta: number, max: number) {
  const current = selections.value[tierId] || 0
  const next = current + delta
  if (next >= 0 && next <= max) {
    selections.value[tierId] = next
  }
}

const totalItems = computed(() => {
  return Object.values(selections.value).reduce((a, b) => a + b, 0)
})

const totalPrice = computed(() => {
  if (!event.value) return 0
  let sum = 0
  event.value.tiers.forEach((t: any) => {
    sum += (selections.value[t.id] || 0) * t.price
  })
  return sum
})

function proceedToCheckout() {
  if (totalItems.value === 0) return
  
  // Guardamos la selección temporalmente para el checkout
  const checkoutData = {
    eventId: event.value.id,
    tiers: Object.entries(selections.value)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const tier = event.value.tiers.find((t:any) => t.id === id)
        return { tierId: id, name: tier.name, price: tier.price, quantity: qty }
      })
  }
  
  localStorage.setItem('pending_checkout', JSON.stringify(checkoutData))
  router.push(`/checkout`)
}

onMounted(() => {
  loadEvent()
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="min-h-screen bg-[#131313] text-white">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-pulse text-violet-400 font-bold text-xl">Cargando experiencia...</div>
    </div>
    
    <div v-else-if="event" class="pb-24">
      <!-- Hero / Flyer Section -->
      <div class="relative h-96 md:h-[32rem] w-full bg-black overflow-hidden flex items-end">
        <!-- Overlay oscuro para contraste -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/60 to-transparent z-10"></div>
        
        <!-- Contenido Hero -->
        <div class="relative z-20 w-full max-w-4xl mx-auto px-6 pb-12">
          <span class="inline-block px-3 py-1 bg-violet-600 text-xs font-bold uppercase tracking-widest rounded-full mb-4">Venta Oficial</span>
          <h1 class="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2 leading-tight">
            {{ event.name }}
          </h1>
          <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-gray-300 font-medium">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              {{ formatDate(event.date) }}
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {{ event.location }}
            </div>
          </div>
        </div>
      </div>

      <!-- Tickets Selection Section -->
      <div class="max-w-4xl mx-auto px-6 mt-8">
        <h2 class="text-2xl font-bold mb-6 border-b border-gray-800 pb-4">Selecciona tus Boletos</h2>
        
        <div class="space-y-4">
          <div v-for="tier in event.tiers" :key="tier.id" class="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-700 transition-colors">
            <div>
              <h3 class="text-xl font-bold text-violet-100">{{ tier.name }}</h3>
              <p class="text-violet-400 font-mono text-lg mt-1">${{ tier.price.toFixed(2) }} <span class="text-xs text-gray-500 font-sans uppercase">USD</span></p>
            </div>
            
            <div class="flex items-center gap-4 bg-[#131313] p-1.5 rounded-xl border border-gray-800 self-end md:self-auto">
              <button 
                @click="updateQuantity(tier.id, -1, tier.capacity)" 
                :disabled="selections[tier.id] === 0"
                class="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
              </button>
              
              <span class="w-8 text-center font-bold text-lg">{{ selections[tier.id] }}</span>
              
              <button 
                @click="updateQuantity(tier.id, 1, tier.capacity)" 
                :disabled="selections[tier.id] >= tier.capacity"
                class="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky Floating Bar -->
      <div v-if="totalItems > 0" class="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#131313] via-[#131313] to-transparent pointer-events-none z-50">
        <div class="max-w-4xl mx-auto bg-violet-600 border border-violet-500 rounded-2xl p-4 flex justify-between items-center shadow-2xl shadow-violet-900/50 pointer-events-auto">
          <div>
            <div class="text-violet-200 text-sm font-medium">{{ totalItems }} boletos</div>
            <div class="text-2xl font-black text-white">${{ totalPrice.toFixed(2) }}</div>
          </div>
          <button @click="proceedToCheckout" class="bg-white text-violet-900 hover:bg-gray-100 font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
            Continuar
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
