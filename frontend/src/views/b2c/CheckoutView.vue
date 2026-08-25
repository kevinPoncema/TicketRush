<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '../../components/ui/BaseInput.vue'
import BaseButton from '../../components/ui/BaseButton.vue'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const router = useRouter()
const cart = ref<any>(null)
const loading = ref(false)
const errorMsg = ref('')

const timeLeft = ref(900)
let timerInterval: any = null

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0')
  const s = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const form = ref({
  clientName: '',
  clientEmail: '',
  cardNumber: '',
  expiry: '',
  cvc: ''
})

const total = computed(() => {
  if (!cart.value) return 0
  return cart.value.tiers.reduce((acc: number, t: any) => acc + (t.price * t.quantity), 0)
})

onMounted(() => {
  const pending = localStorage.getItem('pending_checkout')
  if (!pending) {
    alert('No hay boletos seleccionados')
    router.push('/')
    return
  }
  cart.value = JSON.parse(pending)
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timerInterval)
      alert('El tiempo de reserva ha expirado. Los boletos han sido liberados.')
      localStorage.removeItem('pending_checkout')
      router.push(`/e/${cart.value.eventId}`)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

async function processPayment() {
  loading.value = true
  errorMsg.value = ''
  try {
    const idempotencyKey = crypto.randomUUID()
    const token = localStorage.getItem('access_token')

    const payload = {
      clientName: form.value.clientName,
      clientEmail: form.value.clientEmail,
      tiers: cart.value.tiers.map((t: any) => ({
        ticketTierId: t.tierId,
        quantity: t.quantity
      }))
    }

    const response = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Error al procesar la orden')
    }

    const data = await response.json()
    localStorage.removeItem('pending_checkout')
    router.push(`/success?orderId=${data.orderId}`)
  } catch (e: any) {
    errorMsg.value = e.message || 'Hubo un error procesando el pago'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#131313] text-white pt-10 pb-20">
    <div v-if="!cart" class="text-center mt-20">Cargando reserva...</div>
    
    <div v-else class="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
      
      <!-- Formulario -->
      <div class="lg:col-span-7 space-y-8">
        <div>
          <h1 class="text-3xl font-black text-white tracking-tight mb-2">Checkout</h1>
          <p class="text-gray-400">Estás a un paso de asegurar tu acceso.</p>
        </div>

        <div v-if="errorMsg" class="bg-red-900/20 border border-red-500/30 p-4 rounded-xl text-red-300 text-sm">{{ errorMsg }}</div>

        <form @submit.prevent="processPayment" class="space-y-8">
          
          <!-- Datos Personales -->
          <div class="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
            <h2 class="text-xl font-bold mb-4 text-violet-400">1. Tus Datos</h2>
            <div class="space-y-4">
              <BaseInput label="Nombre Completo" v-model="form.clientName" required placeholder="Ej. Juan Pérez" />
              <BaseInput label="Correo Electrónico (Para recuperar tus entradas)" type="email" v-model="form.clientEmail" required placeholder="juan@gmail.com" />
            </div>
            <div class="mt-4 bg-violet-900/20 border border-violet-500/30 p-3 rounded-lg flex items-start gap-3">
              <svg class="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p class="text-xs text-violet-200">Tus entradas se descargarán inmediatamente al pagar usando un PIN seguro.</p>
            </div>
          </div>

          <!-- Datos de Pago (simulados) -->
          <div class="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
            <h2 class="text-xl font-bold mb-4 text-violet-400">2. Pago Seguro</h2>
            <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 mb-6 flex items-center justify-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <span class="text-sm font-medium text-gray-300">Modo de Simulación (No se realizarán cobros reales)</span>
            </div>
            <div class="space-y-4">
              <BaseInput label="Número de Tarjeta Falsa" v-model="form.cardNumber" required placeholder="4242 4242 4242 4242" />
              <div class="grid grid-cols-2 gap-4">
                <BaseInput label="Vencimiento" v-model="form.expiry" required placeholder="MM/YY" />
                <BaseInput label="CVC" v-model="form.cvc" required placeholder="123" />
              </div>
            </div>
          </div>

          <BaseButton type="submit" variant="primary" :loading="loading" class="w-full py-4 text-lg">
            Pagar ${{ total.toFixed(2) }} USD
          </BaseButton>
        </form>
      </div>

      <!-- Resumen -->
      <div class="lg:col-span-5">
        <div class="sticky top-8 bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-2xl">
          <div class="flex items-center justify-between bg-red-900/20 border border-red-500/30 p-4 rounded-xl mb-6">
            <div>
              <p class="text-xs font-bold text-red-400 uppercase tracking-wider">Tus boletos están reservados por</p>
              <p class="text-3xl font-black text-white font-mono mt-1">{{ formattedTime }}</p>
            </div>
            <svg class="w-8 h-8 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>

          <h3 class="text-lg font-bold border-b border-gray-800 pb-3 mb-4">Resumen del Pedido</h3>
          <div class="space-y-4 mb-6">
            <div v-for="(item, idx) in cart.tiers" :key="idx" class="flex justify-between items-center text-sm">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 bg-gray-800 rounded flex items-center justify-center font-bold text-gray-300 text-xs">{{ item.quantity }}x</span>
                <span class="text-gray-300">{{ item.name }}</span>
              </div>
              <span class="font-mono text-gray-400">${{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
          <div class="border-t border-gray-800 pt-4 flex justify-between items-center">
            <span class="font-bold text-gray-400">Total a Pagar</span>
            <span class="text-2xl font-black text-violet-400">${{ total.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
