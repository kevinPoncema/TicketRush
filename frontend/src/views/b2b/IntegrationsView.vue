<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseInput from '../../components/ui/BaseInput.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import { TenantService } from '../../services/tenant.service'

const loading = ref(true)
const saving = ref(false)

const form = ref({
  webhookUrl: '',
  customDomain: '',
  brandColor: '#8b5cf6',
  currency: 'usd'
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
