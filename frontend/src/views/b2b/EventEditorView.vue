<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseInput from '../../components/ui/BaseInput.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import { EventService } from '../../services/event.service'

const router = useRouter()
const route = useRoute()

const isEditing = ref(false)
const loading = ref(false)
const uploading = ref(false)

async function handleBannerUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  uploading.value = true
  const formData = new FormData()
  formData.append('file', input.files[0])
  
  try {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(`${BASE_URL}/upload/image?entity=event`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData
    })
    
    if (!response.ok) throw new Error('Error subiendo imagen')
    const data = await response.json()
    form.value.bannerUrl = data.url
  } catch(e) {
    alert('Fallo al subir el banner al servidor')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

const form = ref({
  id: '',
  name: '',
  date: '',
  location: '',
  bannerUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
})

const tiers = ref([
  { id: '', name: 'General', price: 0, capacity: 100, description: '' }
])

function addTier() {
  tiers.value.push({ id: '', name: '', price: 0, capacity: 0, description: '' })
}

function removeTier(index: number) {
  if (tiers.value.length > 1) {
    tiers.value.splice(index, 1)
  }
}

async function loadEvent(id: string) {
  try {
    const data: any = await EventService.getEvent(id)
    form.value = { id: data.id, name: data.name, date: data.date?.slice(0, 16) ?? '', location: data.location, bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60' }
    // La API real usa ticketTiers
    const apiTiers = data.ticketTiers || data.tiers || []
    tiers.value = apiTiers.map((t: any) => ({
      id: t.id || '',
      name: t.name,
      price: Number(t.price),
      capacity: t.availableStock ?? t.capacity,
      description: t.description || ''
    }))
    if (tiers.value.length === 0) {
      tiers.value = [{ id: '', name: 'General', price: 0, capacity: 100, description: '' }]
    }
  } catch (e) {
    alert('No se pudo cargar el evento')
    router.push('/b2b')
  }
}

async function save() {
  if (tiers.value.length === 0) {
    alert('Debes añadir al menos una categoría de tickets')
    return
  }
  loading.value = true
  try {
    await EventService.saveEvent(form.value, tiers.value)
    router.push('/b2b')
  } catch (e: any) {
    alert(e.message || 'Error al guardar evento')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.params.id) {
    isEditing.value = true
    loadEvent(route.params.id as string)
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto pb-12">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h2 class="text-3xl font-bold">{{ isEditing ? 'Editar Evento' : 'Crear Nuevo Evento' }}</h2>
        <p class="text-gray-400 text-sm mt-1">Configura la información general y el inventario de boletos.</p>
      </div>
      <BaseButton variant="secondary" @click="router.push('/b2b')">Cancelar</BaseButton>
    </div>

    <form @submit.prevent="save" class="space-y-8">
      <div class="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 space-y-6">
        <h3 class="text-xl font-bold text-violet-400 border-b border-gray-800 pb-2">1. Detalles Principales</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput label="Nombre del Evento" v-model="form.name" required placeholder="Ej. Neon Nights Festival" />
          <BaseInput label="Fecha y Hora" type="datetime-local" v-model="form.date" required />
          <div class="md:col-span-2">
            <BaseInput label="Ubicación" v-model="form.location" required placeholder="Estadio Nacional, Neo-Tokyo" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-300 mb-2">Banner del Evento (Sube o Pega URL)</label>
            <div class="flex items-center gap-4">
              <div class="relative w-24 h-14 rounded-lg bg-black border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-violet-500 transition-colors shrink-0">
                <img v-if="form.bannerUrl" :src="form.bannerUrl" class="w-full h-full object-cover" />
                <span v-else class="text-[10px] text-gray-500 text-center leading-tight">Subir<br/>Banner</span>
                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleBannerUpload" :disabled="uploading" />
                <div v-if="uploading" class="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div class="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div class="flex-1">
                <BaseInput label="" v-model="form.bannerUrl" placeholder="Sube un archivo o pega el link..." />
                <p class="text-[10px] text-gray-500 mt-1">Soporta S3, DigitalOcean Spaces, u URLs externas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <div class="flex justify-between items-center border-b border-gray-800 pb-2 mb-6">
          <h3 class="text-xl font-bold text-violet-400">2. Categorías de Tickets (Tiers)</h3>
          <BaseButton type="button" variant="secondary" @click="addTier" class="text-sm px-4 py-1">+ Añadir Tier</BaseButton>
        </div>

        <div class="space-y-4">
          <div v-for="(tier, index) in tiers" :key="index" class="flex flex-col gap-4 bg-[#131313] p-4 rounded-lg border border-gray-800">
            <div class="flex flex-col md:flex-row gap-4 items-end">
              <div class="flex-1 w-full">
                <BaseInput label="Nombre de Categoría" v-model="tier.name" required placeholder="Ej. VIP" />
              </div>
              <div class="w-full md:w-32">
                <BaseInput label="Precio ($)" type="number" min="0" v-model="tier.price" required />
              </div>
              <div class="w-full md:w-32">
                <BaseInput label="Capacidad" type="number" min="1" v-model="tier.capacity" required />
              </div>
              <BaseButton 
                type="button" 
                variant="danger" 
                @click="removeTier(index)"
                :disabled="tiers.length === 1"
                class="w-full md:w-auto"
              >
                Quitar
              </BaseButton>
            </div>
            <div class="w-full">
              <BaseInput label="Descripción (Opcional)" v-model="tier.description" placeholder="Ej. Acceso anticipado y mercancía oficial..." />
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <BaseButton type="submit" variant="primary" :loading="loading" class="w-full md:w-auto px-10 py-3 text-lg">
          {{ isEditing ? 'Actualizar Evento' : 'Publicar Evento' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
