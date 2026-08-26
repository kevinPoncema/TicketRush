<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseInput from '../../components/ui/BaseInput.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import { TenantService } from '../../services/tenant.service'

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)

async function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  uploading.value = true
  const formData = new FormData()
  formData.append('file', input.files[0])
  
  try {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(`${BASE_URL}/upload/image?entity=tenant`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData
    })
    
    if (!response.ok) throw new Error('Error subiendo imagen')
    const data = await response.json()
    form.value.logoUrl = data.url
  } catch(e) {
    alert('Fallo al subir el logo al servidor')
  } finally {
    uploading.value = false
    input.value = ''
  }
}


const form = ref({
  webhookUrl: '',
  customDomain: '',
  brandColor: '#8b5cf6',
  currency: 'usd',
  logoUrl: ''
})

async function loadConfig() {
  try {
    const data: any = await TenantService.getConfig()
    form.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const payload: any = { 
      webhookUrl: form.value.webhookUrl || null,
      customDomain: form.value.customDomain || null,
      brandColor: form.value.brandColor || '#8b5cf6',
      currency: form.value.currency || 'usd'
    }
    await TenantService.updateConfig(payload)
    alert('Configuración guardada correctamente')
  } catch (e) {
    alert('Error al guardar la configuración')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="max-w-4xl mx-auto pb-12">
    <div class="mb-8">
      <h2 class="text-3xl font-bold">Configuración e Integraciones</h2>
      <p class="text-gray-400 text-sm mt-1">Personaliza tu marca y conecta VANTAGE con tus flujos de trabajo (n8n, Make, Zapier).</p>
    </div>

    <div v-if="loading" class="p-8 text-center text-gray-500 animate-pulse bg-[#1a1a1a] rounded-xl border border-gray-800">
      Cargando configuración...
    </div>

    <form v-else @submit.prevent="save" class="space-y-8">
      
      <!-- Sección de Automatización (Webhooks) -->
      <div class="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-violet-400 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Automatización (Webhooks)
          </h3>
          <p class="text-sm text-gray-400 mt-1">Recibe notificaciones HTTP POST en tiempo real cada vez que un cliente complete una compra. Ideal para emitir facturas automáticas o guardar datos en tu CRM.</p>
        </div>
        
        <div class="pt-2 border-t border-gray-800">
          <BaseInput 
            label="Webhook URL (Endpoint de Destino)" 
            type="url" 
            v-model="form.webhookUrl" 
            placeholder="https://tu-n8n.com/webhook/ticketrush" 
          />
          <p class="text-xs text-gray-500 mt-2">
            El payload contendrá el <code>orderId</code>, información del cliente y los <code>tickets</code> generados con su firma criptográfica.
          </p>
        </div>
      </div>

      <!-- Sección de Marca (White-Label) -->
      <div class="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-violet-400">Personalización de Marca (White-label)</h3>
          <p class="text-sm text-gray-400 mt-1">Ajusta la apariencia del motor de reservas para que coincida con la identidad de tu productora.</p>
        </div>
        
        <div class="pt-2 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput 
            label="Dominio Personalizado (Opcional)" 
            v-model="form.customDomain" 
            placeholder="tickets.miproductora.com" 
          />

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-300 mb-2">Logo de la Empresa (Sube o Pega URL)</label>
            <div class="flex items-center gap-4">
              <div class="relative w-16 h-16 rounded-full bg-black border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-violet-500 transition-colors shrink-0">
                <img v-if="form.logoUrl" :src="form.logoUrl" class="w-full h-full object-cover" />
                <span v-else class="text-[10px] text-gray-500 text-center leading-tight">Subir<br/>Logo</span>
                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleLogoUpload" :disabled="uploading" />
                <div v-if="uploading" class="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div class="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div class="flex-1">
                <BaseInput label="" v-model="form.logoUrl" placeholder="Sube un archivo o pega el link directo..." />
                <p class="text-[10px] text-gray-500 mt-1">Soporta S3, DigitalOcean Spaces, u URLs externas.</p>
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Moneda de Cobro (Stripe)</label>
            <select v-model="form.currency" class="w-full bg-[#131313] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors uppercase">
              <option value="usd">USD - Dólar Estadounidense</option>
              <option value="eur">EUR - Euro</option>
              <option value="mxn">MXN - Peso Mexicano</option>
              <option value="ars">ARS - Peso Argentino</option>
              <option value="clp">CLP - Peso Chileno</option>
              <option value="cop">COP - Peso Colombiano</option>
              <option value="pen">PEN - Sol Peruano</option>
              <option value="brl">BRL - Real Brasileño</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Color Principal de Marca (HEX)</label>
            <div class="flex items-center gap-3">
              <input type="color" v-model="form.brandColor" class="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
              <input type="text" v-model="form.brandColor" class="w-full bg-[#131313] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <BaseButton type="submit" variant="primary" :loading="saving" class="w-full md:w-auto px-10 py-3 text-lg">
          Guardar Configuración
        </BaseButton>
      </div>

    </form>
  </div>
</template>
