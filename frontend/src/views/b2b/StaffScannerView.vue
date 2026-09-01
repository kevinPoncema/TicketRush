<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const scannerNode = ref<HTMLElement | null>(null)
let html5QrCode: Html5Qrcode | null = null

const scanning = ref(false)
const scanResult = ref<{ status: 'IDLE' | 'SUCCESS' | 'ERROR', message: string, payload: string }>({ 
  status: 'IDLE', 
  message: '', 
  payload: '' 
})

async function handleScanSuccess(decodedText: string) {
  if (scanResult.value.status !== 'IDLE') return
  
  if (html5QrCode?.isScanning) html5QrCode.pause()

  try {
    let ticketPayload: { ticketId: string; signature: string }
    try {
      const parsed = JSON.parse(decodedText)
      ticketPayload = {
        ticketId: parsed.ticketId || parsed.id,
        signature: parsed.signature || parsed.sig
      }
      if (!ticketPayload.ticketId || !ticketPayload.signature) {
        throw new Error('Faltan datos')
      }
    } catch {
      throw new Error('QR inválido: formato no reconocido')
    }

    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BASE_URL}/tickets/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(ticketPayload)
    })

    const data = await response.json()

    if (response.ok && data.success) {
      scanResult.value = { status: 'SUCCESS', message: data.message || 'Acceso concedido', payload: decodedText }
    } else {
      throw new Error(data.message || 'Ticket inválido')
    }
  } catch (e: any) {
    scanResult.value = { status: 'ERROR', message: e.message || 'Error de validación', payload: decodedText }
  }

  setTimeout(() => {
    scanResult.value = { status: 'IDLE', message: '', payload: '' }
    if (html5QrCode?.isScanning) html5QrCode.resume()
  }, 3000)
}

function handleScanFailure() {
  // Ignorar errores de frame (se disparan en cada frame sin QR)
}

async function startScanner() {
  if (!scannerNode.value) return
  html5QrCode = new Html5Qrcode("reader")
  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      handleScanSuccess,
      handleScanFailure
    )
    scanning.value = true
  } catch (err) {
    console.error("Error al iniciar el escáner:", err)
    alert("No se pudo acceder a la cámara. Asegúrate de dar permisos.")
  }
}

async function stopScanner() {
  if (html5QrCode?.isScanning) {
    await html5QrCode.stop()
    html5QrCode.clear()
    scanning.value = false
  }
}

onMounted(() => { startScanner() })
onUnmounted(() => { stopScanner() })
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
    
    <!-- Encabezado Móvil -->
    <div class="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-20">
      <div>
        <h1 class="text-xl font-black tracking-widest text-white uppercase">VANTAGE</h1>
        <p class="text-xs text-violet-400 font-mono mt-1">STAFF SCANNER v2.0</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full animate-pulse" :class="scanning ? 'bg-green-500' : 'bg-red-500'"></div>
        <span class="text-xs font-bold text-gray-300 uppercase">{{ scanning ? 'En Línea' : 'Offline' }}</span>
      </div>
    </div>

    <!-- Área de Escaneo -->
    <div class="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center p-4">
      
      <div 
        id="reader" 
        ref="scannerNode" 
        class="w-full h-full rounded-3xl overflow-hidden bg-[#111] shadow-[0_0_50px_rgba(139,92,246,0.1)] transition-opacity duration-300"
        :class="{ 'opacity-0 absolute pointer-events-none': scanResult.status !== 'IDLE' }"
      ></div>
      
      <!-- Miras -->
      <div v-if="scanResult.status === 'IDLE' && scanning" class="absolute inset-0 pointer-events-none p-12">
        <div class="w-full h-full border-2 border-violet-500/50 rounded-2xl relative">
          <div class="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-violet-400 rounded-tl-xl"></div>
          <div class="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-violet-400 rounded-tr-xl"></div>
          <div class="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-violet-400 rounded-bl-xl"></div>
          <div class="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-violet-400 rounded-br-xl"></div>
          <div class="absolute top-0 left-0 right-0 h-0.5 bg-violet-400 shadow-[0_0_15px_rgba(167,139,250,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <!-- Pantalla de Éxito -->
      <div v-if="scanResult.status === 'SUCCESS'" class="absolute inset-4 bg-green-500 rounded-3xl flex flex-col items-center justify-center text-black z-30 p-6 animate-[popIn_0.3s_ease-out]">
        <div class="w-24 h-24 bg-black text-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 class="text-4xl font-black uppercase tracking-tight mb-2 text-center">Aprobado</h2>
        <p class="text-sm font-bold opacity-80 uppercase tracking-widest text-center">{{ scanResult.message }}</p>
        <p class="absolute bottom-6 text-xs font-bold opacity-50 uppercase">Escaneando próximo...</p>
      </div>

      <!-- Pantalla de Error -->
      <div v-if="scanResult.status === 'ERROR'" class="absolute inset-4 bg-red-600 rounded-3xl flex flex-col items-center justify-center text-white z-30 p-6 animate-[popIn_0.3s_ease-out]">
        <div class="w-24 h-24 bg-black text-red-500 rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
        </div>
        <h2 class="text-4xl font-black uppercase tracking-tight mb-2 text-center">Rechazado</h2>
        <p class="text-sm font-bold opacity-80 text-center px-4">{{ scanResult.message }}</p>
        <p class="absolute bottom-6 text-xs font-bold opacity-50 uppercase">Escaneando próximo...</p>
      </div>
    </div>

    <!-- Instrucciones -->
    <div class="absolute bottom-10 left-0 right-0 text-center px-6">
      <p class="text-gray-500 text-sm font-medium">Apunta la cámara al Código QR del asistente.<br/>La validación es automática.</p>
    </div>
  </div>
</template>

<style>
#reader__dashboard_section_csr,
#reader__dashboard_section_swaplink { display: none !important; }
#reader { border: none !important; }
#reader video { 
  object-fit: cover !important; 
  transform: scaleX(-1) !important; 
  -webkit-transform: scaleX(-1) !important;
  transform-origin: center center !important;
}

@keyframes scan {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(calc(100% - 2px)); }
}
@keyframes popIn {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
