<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AuthService } from '../../services/auth.service'
import type { User } from '../../types/api.types'

const members = ref<User[]>([])
const loading = ref(false)

const showModal = ref(false)
const form = ref({ name: '', email: '', password: '', role: 'STAFF' as 'STAFF' | 'ADMIN' })
const formLoading = ref(false)

async function fetchMembers() {
  loading.value = true
  try {
    const data: any = await AuthService.listMembers()
    members.value = data
  } finally {
    loading.value = false
  }
}

async function createMember() {
  formLoading.value = true
  try {
    const newUser: any = await AuthService.createMember(form.value)
    members.value.push(newUser)
    showModal.value = false
    form.value = { name: '', email: '', password: '', role: 'STAFF' }
  } catch (e) {
    alert('Error al crear usuario')
  } finally {
    formLoading.value = false
  }
}

async function deleteMember(id: string) {
  // El backend no implementa DELETE /auth/member/:id todavía.
  // Ver docs/pendiente.md para detalles.
  try { await AuthService.deleteMember(id); await fetchMembers(); } catch (e) { alert('Error al eliminar'); }
}

onMounted(() => {
  fetchMembers()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h2 class="text-3xl font-bold">Gestión de Staff</h2>
        <p class="text-gray-400 text-sm mt-1">Agrega cajeros y guardias de seguridad para escanear boletos.</p>
      </div>
      <button @click="showModal = true" class="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
        + Nuevo Miembro
      </button>
    </div>

    <!-- Lista de miembros -->
    <div class="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500 animate-pulse">Cargando usuarios...</div>
      
      <div v-else-if="members.length === 0" class="p-8 text-center">
        <p class="text-gray-500 mb-2">No hay miembros registrados en este Tenant.</p>
        <p class="text-xs text-gray-600">El listado de miembros estará disponible cuando el backend implemente el endpoint <code class="text-violet-400">GET /auth/members</code>.</p>
      </div>

      <table v-else class="w-full text-left">
        <thead class="bg-gray-800/50 text-xs uppercase text-gray-400">
          <tr>
            <th class="px-6 py-4 font-medium">Usuario</th>
            <th class="px-6 py-4 font-medium">Rol</th>
            <th class="px-6 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr v-for="member in members" :key="member.id" class="hover:bg-gray-800/20 transition-colors">
            <td class="px-6 py-4">
              <div class="font-medium">{{ member.email.split("@")[0] }}</div>
              <div class="text-xs text-gray-500 font-mono mt-0.5">{{ member.email }}</div>
              <div class="text-xs text-gray-500 font-mono mt-0.5">ID: {{ member.id }}</div>
            </td>
            <td class="px-6 py-4">
              <span :class="['px-2.5 py-1 rounded-full text-xs font-bold', member.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-400' : 'bg-gray-700 text-gray-300']">
                {{ member.role }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <button @click="deleteMember(member.id)" class="text-sm text-red-400 hover:text-red-300 font-medium">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para Crear Miembro -->
    <div v-if="showModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-[#1a1a1a] w-full max-w-md rounded-2xl border border-gray-800 p-6">
        <h3 class="text-xl font-bold mb-4">Añadir Miembro del Staff</h3>
        <form @submit.prevent="createMember" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Nombre</label>
            <input v-model="form.name" required type="text" class="w-full bg-[#131313] border border-gray-700 rounded-lg px-4 py-2 focus:border-violet-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Correo Electrónico</label>
            <input v-model="form.email" required type="email" class="w-full bg-[#131313] border border-gray-700 rounded-lg px-4 py-2 focus:border-violet-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Contraseña (Provisional)</label>
            <input v-model="form.password" required type="password" class="w-full bg-[#131313] border border-gray-700 rounded-lg px-4 py-2 focus:border-violet-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Rol</label>
            <select v-model="form.role" class="w-full bg-[#131313] border border-gray-700 rounded-lg px-4 py-2 focus:border-violet-500 focus:outline-none text-white">
              <option value="STAFF">Staff (Escáner de Puerta)</option>
              <option value="ADMIN">Admin (Gestión Total)</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
            <button :disabled="formLoading" type="submit" class="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg font-medium">
              {{ formLoading ? 'Guardando...' : 'Añadir' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
