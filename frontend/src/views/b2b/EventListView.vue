<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { EventService } from '../../services/event.service'
import BaseButton from '../../components/ui/BaseButton.vue'

const router = useRouter()
const events = ref<any[]>([])
const loading = ref(true)

async function fetchEvents() {
  loading.value = true
  try {
    const data: any = await EventService.listEvents()
    events.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h2 class="text-3xl font-bold">Catálogo de Eventos</h2>
        <p class="text-gray-400 text-sm mt-1">Gestiona los eventos activos de tu organización.</p>
      </div>
      <BaseButton @click="router.push('/b2b/events/new')">+ Crear Evento</BaseButton>
    </div>

    <div class="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500 animate-pulse">Cargando eventos...</div>
      
      <table v-else class="w-full text-left">
        <thead class="bg-gray-800/50 text-xs uppercase text-gray-400">
          <tr>
            <th class="px-6 py-4 font-medium">Nombre del Evento</th>
            <th class="px-6 py-4 font-medium">Fecha</th>
            <th class="px-6 py-4 font-medium">Ubicación</th>
            <th class="px-6 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr v-for="event in events" :key="event.id" class="hover:bg-gray-800/20 transition-colors">
            <td class="px-6 py-4">
              <div class="font-bold text-violet-100">{{ event.name }}</div>
              <div class="text-xs text-gray-500 font-mono mt-0.5">{{ event.id }}</div>
            </td>
            <td class="px-6 py-4 text-gray-300">{{ formatDate(event.date) }}</td>
            <td class="px-6 py-4 text-gray-300">{{ event.location }}</td>
            <td class="px-6 py-4 text-right">
              <button @click="router.push(`/b2b/events/${event.id}/edit`)" class="text-sm text-violet-400 hover:text-violet-300 font-medium">
                Editar
              </button>
            </td>
          </tr>
          <tr v-if="events.length === 0">
            <td colspan="4" class="px-6 py-12 text-center">
              <p class="text-gray-500 mb-4">No tienes eventos creados todavía.</p>
              <BaseButton variant="secondary" @click="router.push('/b2b/events/new')">Crear tu primer evento</BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
