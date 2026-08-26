<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseInput from '../../components/ui/BaseInput.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import { TenantService } from '../../services/tenant.service'

const loading = ref(true)
const saving = ref(false)
const uploadingLogo = ref(false)
const uploadingBanner = ref(false)

async function handleFileUpload(event: Event, type: 'logo' | 'banner') {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  if (type === 'logo') uploadingLogo.value = true
  else uploadingBanner.value = true

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
    
    if (type === 'logo') form.value.logoUrl = data.url
    else form.value.bannerUrl = data.url
  } catch(e) {
    alert('Fallo al subir el archivo al servidor')
  } finally {
    if (type === 'logo') uploadingLogo.value = false
    else uploadingBanner.value = false
    input.value = ''
  }
}

const form = ref({
  webhookUrl: '',
  customDomain: '',
  brandColor: '#8b5cf6',
  currency: 'usd',
  logoUrl: '',
  bannerUrl: ''
})

async function loadConfig() {
  try {
    const data: any = await TenantService.getConfig()
    form.value = {
      ...form.value,
      ...data
    }
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
      currency: form.value.currency || 'usd',
      logoUrl: form.value.logoUrl || null,
      bannerUrl: form.value.bannerUrl || null
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
      
      <!-- Automatización -->
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

      <!-- Marca -->
      <div class="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-violet-400">Personalización de Marca (White-label)</h3>
          <p class="text-sm text-gray-400 mt-1">Ajusta la apariencia del motor de reservas para que coincida con la identidad de tu productora.</p>
        </div>
        
        <div class="pt-2 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="md:col-span-2">
            <BaseInput 
              label="Dominio Personalizado (Opcional)" 
              v-model="form.customDomain" 
              placeholder="tickets.miproductora.com" 
            />
          </div>

          <!-- Logo -->
          <div class="md:col-span-2 flex flex-col gap-2">
            <label class="block text-sm font-medium text-gray-300">Logo de la Empresa</label>
            <div class="flex items-center gap-6">
              <div class="group relative w-32 h-32 rounded-full bg-black border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-violet-500 transition-colors shrink-0 shadow-lg">
                <img v-if="form.logoUrl" :src="form.logoUrl" class="w-full h-full object-cover transition-opacity group-hover:opacity-40" />
                <span v-if="!form.logoUrl" class="text-xs text-gray-500 text-center leading-tight font-medium">Subir<br/>Logo</span>
                
                <div class="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 pointer-events-none">
                  <svg class="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span class="text-[10px] font-bold text-white shadow-sm">{{ form.logoUrl ? 'Cambiar' : 'Seleccionar' }}</span>
                </div>

                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" @change="(e) => handleFileUpload(e, 'logo')" :disabled="uploadingLogo" />
                <div v-if="uploadingLogo" class="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                  <div class="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div class="flex-1">
                <BaseInput label="URL del Logo (Opcional)" v-model="form.logoUrl" placeholder="Sube un archivo o pega el link directo..." />
                <p class="text-[10px] text-gray-500 mt-1">Recomendado: Cuadrado (1:1), fondo transparente.</p>
              </div>
            </div>
          </div>

          <!-- Banner -->
          <div class="md:col-span-2 flex flex-col gap-2">
            <label class="block text-sm font-medium text-gray-300">Banner de la Organización</label>
            <div class="flex items-center gap-6">
              <div class="group relative w-48 h-28 rounded-xl bg-black border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-violet-500 transition-colors shrink-0 shadow-lg">
                <img v-if="form.bannerUrl" :src="form.bannerUrl" class="w-full h-full object-cover transition-opacity group-hover:opacity-40" />
                <span v-if="!form.bannerUrl" class="text-xs text-gray-500 text-center leading-tight font-medium">Subir<br/>Banner</span>
                
                <div class="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 pointer-events-none">
                  <svg class="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span class="text-xs font-bold text-white shadow-sm">{{ form.bannerUrl ? 'Cambiar Imagen' : 'Seleccionar' }}</span>
                </div>

                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" @change="(e) => handleFileUpload(e, 'banner')" :disabled="uploadingBanner" />
                <div v-if="uploadingBanner" class="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                  <div class="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div class="flex-1">
                <BaseInput label="URL del Banner (Opcional)" v-model="form.bannerUrl" placeholder="Sube un archivo o pega el link directo..." />
                <p class="text-[10px] text-gray-500 mt-1">Este banner aparecerá en la cabecera de tu Tienda Pública.</p>
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
