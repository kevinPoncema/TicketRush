<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { EventService } from '../../services/event.service'

const router = useRouter()
const route = useRoute()

const event = ref<any>(null)
const loading = ref(true); console.log('Component setup executing');
const errorMsg = ref('')

// Cantidades seleccionadas por tier (tierId -> quantity)
const selections = ref<Record<string, number>>({})

async function loadEvent() {
  try {
    const id = route.params.id as string
    const data: any = await EventService.getEvent(id)
    event.value = data
    // Inicializar contadores en 0
    if (!data.tiers) data.tiers = [];
    data.tiers.forEach((t: any) => {
      selections.value[t.id] = 0
    })
  } catch (e: any) {
    console.error('Error loading event:', e);
    errorMsg.value = 'Evento no encontrado o ID inválido. Por favor, intenta de nuevo.';
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
    sum += (selections.value[t.id] || 0) * Number(t.price)
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
        return { tierId: id, name: tier.name, price: Number(tier.price), quantity: qty }
      })
  }
  
  localStorage.setItem('pending_checkout', JSON.stringify(checkoutData))
  router.push(`/checkout`)
}

onMounted(() => {
  console.log('EventDetailView mounted. ID:', route.params.id);

  loadEvent()
})

function formatDate(dateStr: string) {
  if (!dateStr) return 'Fecha por definir'
  return new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>


<template>
  <div class="min-h-screen bg-[#0d0d0d] text-white font-sans selection:bg-violet-500/30">
    
    <!-- Navbar simplificado -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/80 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="text-xl font-black tracking-widest uppercase">VANTAGE</div>
      </div>
    </header>

    <div v-if="errorMsg" class="flex flex-col items-center justify-center min-h-screen text-center px-4 pt-16">
      <div class="text-red-500 font-bold text-2xl mb-2">Ups, algo salió mal</div>
      <p class="text-gray-400 mb-6">{{ errorMsg }}</p>
      <button @click="router.push('/')" class="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">Volver al inicio</button>
    </div>
    
    <div v-else-if="loading" class="flex items-center justify-center min-h-screen pt-16">
      <div class="animate-pulse text-violet-400 font-bold text-xl">Cargando experiencia...</div>
    </div>
    
    <div v-else-if="event" class="pb-32 pt-16">
      <!-- Hero / Flyer Section -->
      <div class="relative h-[60vh] min-h-[400px] w-full bg-black overflow-hidden flex items-end">
        <!-- Banner genérico -->
        <img src="https://images.unsplash.com/photo-1559223607-a43c990c692c?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80" class="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen" alt="Event Banner">
        
        <!-- Overlay oscuro para contraste tipo gradiente radial/linear -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent z-10"></div>
        
        <!-- Contenido Hero -->
        <div class="relative z-20 w-full max-w-5xl mx-auto px-6 pb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6">
            <div class="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
            <span class="text-xs font-mono tracking-widest text-gray-300 uppercase">Selling Fast</span>
          </div>
          
          <h1 class="text-6xl md:text-8xl font-black text-white mb-6 leading-none tracking-tighter uppercase">
            {{ event.name }}
          </h1>
          
          <div class="flex flex-col md:flex-row md:items-center gap-4 md:gap-10 text-gray-400 font-mono text-sm uppercase tracking-wider">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              {{ formatDate(event.date) }}
            </div>
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {{ event.location }}
            </div>
          </div>
        </div>
      </div>

      <!-- Tickets Selection Section -->
      <div class="max-w-5xl mx-auto px-6 mt-12">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold tracking-tight">Select Tickets</h2>
        </div>
        
        <div class="space-y-6">
          <div v-for="(tier, index) in event.tiers" :key="tier.id" 
               class="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden flex flex-col md:flex-row relative group transition-colors hover:bg-[#1a1a1a]"
               :class="{'border-l-4 border-l-violet-500': index === event.tiers.length - 1}"
          >
            <!-- Etiqueta popular en el último tier -->
            <div v-if="index === event.tiers.length - 1" class="absolute top-0 right-0 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-lg">
              Popular
            </div>

            <!-- Info (Left) -->
            <div class="flex-1 p-8 md:p-10 flex flex-col justify-center">
              <h3 class="text-2xl font-bold text-white mb-2">{{ tier.name }}</h3>
              <p class="text-gray-400 text-sm mb-4 leading-relaxed max-w-xl">
                {{ tier.description || 'Acceso oficial para el evento. Asegura tu lugar antes de que se agoten las existencias de esta categoría.' }}
              </p>
              
              <!-- Scarcity Indicator -->
              <div class="mb-6 flex items-center gap-3">
                <div class="flex-1 max-w-[200px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-1000" 
                    :class="[
                      tier.capacity <= 20 ? 'bg-red-500 w-1/4' : 
                      tier.capacity <= 50 ? 'bg-orange-500 w-2/4' : 'bg-green-500 w-3/4'
                    ]"
                  ></div>
                </div>
                <span 
                  class="text-xs font-bold uppercase tracking-wider"
                  :class="[
                    tier.capacity <= 20 ? 'text-red-400 animate-pulse' : 
                    tier.capacity <= 50 ? 'text-orange-400' : 'text-green-400'
                  ]"
                >
                  {{ tier.capacity <= 20 ? '¡Casi Agotado!' : tier.capacity <= 50 ? 'Últimos Cupos' : 'Disponible' }} 
                  <span class="text-gray-500 ml-1">({{ tier.capacity }} left)</span>
                </span>
              </div>
              <div class="text-3xl font-black text-white">
                ${{ Number(tier.price).toFixed(2) }}
              </div>
            </div>
            
            <!-- Selector (Right) -->
            <div class="w-full md:w-72 border-t md:border-t-0 md:border-l border-dashed border-gray-700 p-8 flex items-center justify-center bg-[#111111] group-hover:bg-[#151515] transition-colors">
              <div v-if="selections[tier.id] === 0" class="w-full">
                <button 
                  @click="updateQuantity(tier.id, 1, tier.capacity)"
                  class="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all uppercase tracking-wider text-sm"
                >
                  Buy Tickets
                </button>
              </div>
              <div v-else class="flex items-center gap-6">
                <button 
                  @click="updateQuantity(tier.id, -1, tier.capacity)" 
                  class="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-violet-500 hover:bg-violet-500/10 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                </button>
                
                <span class="w-8 text-center font-bold text-3xl">{{ selections[tier.id] }}</span>
                
                <button 
                  @click="updateQuantity(tier.id, 1, tier.capacity)" 
                  :disabled="selections[tier.id] >= tier.capacity"
                  class="w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-violet-500 hover:bg-violet-500/10 disabled:opacity-30 disabled:hover:border-gray-600 disabled:hover:bg-transparent transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Sticky Floating Bar -->
      <div v-if="totalItems > 0" class="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/90 to-transparent pointer-events-none z-50">
        <div class="max-w-5xl mx-auto bg-violet-600 border border-violet-400/30 rounded-2xl p-5 flex justify-between items-center shadow-[0_0_40px_rgba(139,92,246,0.3)] pointer-events-auto backdrop-blur-lg">
          <div>
            <div class="text-violet-200 text-xs font-bold uppercase tracking-widest mb-1">{{ totalItems }} boletos seleccionados</div>
            <div class="text-3xl font-black text-white">${{ totalPrice.toFixed(2) }}</div>
          </div>
          <button @click="proceedToCheckout" class="bg-white text-black hover:bg-gray-200 font-black px-10 py-4 rounded-xl transition-colors flex items-center gap-3 uppercase tracking-wider text-sm">
            Checkout
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

