<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '../../components/ui/BaseInput.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import { getStripe } from '../../services/stripe.service'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const router = useRouter()
const cart = ref<any>(null)
const loading = ref(false)
const errorMsg = ref('')

const step = ref(1)
const orderId = ref('')
const clientSecret = ref('')
let elements: any = null
let stripe: any = null

const timeLeft = ref(900)
let timerInterval: any = null

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0')
  const s = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const form = ref({
  clientName: '',
  clientEmail: ''
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

async function createOrder() {
  if (!form.value.clientName || !form.value.clientEmail) {
    errorMsg.value = 'Por favor completa todos tus datos'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const idempotencyKey = crypto.randomUUID()

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
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Error al generar la orden')
    }

    const data = await response.json()
    orderId.value = data.id
    clientSecret.value = data.clientSecret

    stripe = await getStripe()
    const appearance = { 
      theme: 'night', 
      variables: { 
        colorPrimary: '#8b5cf6', 
        colorBackground: '#1a1a1a', 
        colorText: '#ffffff',
        colorDanger: '#ef4444'
      } 
    }
    
    // @ts-ignore
    elements = stripe.elements({ clientSecret: clientSecret.value, appearance })
    
    step.value = 2
    setTimeout(() => {
      const paymentElement = elements.create('payment')
      paymentElement.mount('#payment-element')
    }, 100)
    
  } catch (e: any) {
    errorMsg.value = e.message || 'Hubo un error procesando la orden'
  } finally {
    loading.value = false
  }
}

async function confirmPayment() {
  loading.value = true
  errorMsg.value = ''
  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required'
    })

    if (error) {
      throw new Error(error.message)
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      const processRes = await fetch(`${BASE_URL}/orders/${orderId.value}/process-payment`, {
        method: 'POST'
      });
      if (!processRes.ok) throw new Error('Error al finalizar la orden en el servidor');
      
      const finalOrder = await processRes.json();
      finalOrder.orderId = finalOrder.id;
      finalOrder.clientEmail = form.value.clientEmail; 
      
      localStorage.setItem(`order_success_${finalOrder.id}`, JSON.stringify(finalOrder));
      localStorage.removeItem('pending_checkout');
      router.push(`/success?orderId=${finalOrder.id}`);
    }
  } catch (e: any) {
    errorMsg.value = e.message || 'El pago falló'
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

        <div class="space-y-8">
          
          <!-- Datos Personales (Paso 1) -->
          <div v-if="step === 1" class="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 transition-all">
            <h2 class="text-xl font-bold mb-4 text-violet-400">1. Tus Datos</h2>
            <form @submit.prevent="createOrder" class="space-y-4">
              <BaseInput label="Nombre Completo" v-model="form.clientName" required placeholder="Ej. Juan Pérez" />
              <BaseInput label="Correo Electrónico (Para recuperar tus entradas)" type="email" v-model="form.clientEmail" required placeholder="juan@gmail.com" />
              
              <div class="mt-4 bg-violet-900/20 border border-violet-500/30 p-3 rounded-lg flex items-start gap-3">
                <svg class="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p class="text-xs text-violet-200">Tus entradas se descargarán inmediatamente al pagar usando un PIN seguro.</p>
              </div>

              <BaseButton type="submit" variant="primary" :loading="loading" class="w-full py-4 text-lg mt-6">
                Continuar al Pago
              </BaseButton>
            </form>
          </div>

          <!-- Datos de Pago Stripe (Paso 2) -->
          <div v-if="step === 2" class="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 transition-all">
            <h2 class="text-xl font-bold mb-4 text-violet-400 flex items-center justify-between">
              <span>2. Pago Seguro</span>
              <svg class="w-8 h-8 text-white" viewBox="0 0 40 40" fill="currentColor"><path d="M20 2c-9.94 0-18 8.06-18 18s8.06 18 18 18 18-8.06 18-18S29.94 2 20 2zm1 25.5v2.89h-2.02v-2.9c-2.48-.38-4.32-2.11-4.32-4.51 0-2.44 1.83-3.8 4.67-4.43 1.94-.43 2.53-.87 2.53-1.63 0-.74-.74-1.29-1.92-1.29-1.2 0-2.09.52-2.42 1.54l-1.92-.81c.56-1.55 1.99-2.58 3.84-2.88V10.6h2.02v2.9c2.25.33 3.93 1.87 3.93 4.14 0 2.62-1.96 4-4.87 4.68-1.93.45-2.33 1.05-2.33 1.76 0 .8.88 1.43 2.15 1.43 1.51 0 2.51-.7 2.87-1.93l1.93.77c-.63 1.75-2.22 2.85-4.14 3.15z"/></svg>
            </h2>
            
            <form @submit.prevent="confirmPayment">
              <!-- Contenedor donde Stripe montará sus elementos -->
              <div id="payment-element" class="mb-6 min-h-[200px]"></div>

              <BaseButton type="submit" variant="primary" :loading="loading" class="w-full py-4 text-lg bg-violet-600 hover:bg-violet-500">
                Pagar ${{ total.toFixed(2) }} USD
              </BaseButton>
            </form>
          </div>

        </div>
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
