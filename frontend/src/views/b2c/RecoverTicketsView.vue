<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '../../components/ui/BaseInput.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import { MockApiService } from '../../services/api.mock'

const router = useRouter()
const loading = ref(false)

const form = ref({
  email: '',
  pin: ''
})

async function attemptRecovery() {
  if (!form.value.email || !form.value.pin) return
  
  loading.value = true
  try {
    const recovered: any = await MockApiService.recoverByPin(form.value.email, form.value.pin)
    if (recovered && recovered.length > 0) {
      // Como el servicio mock ya lo guardó en el localStorage, redirigimos a MyTickets
      router.push('/my-tickets')
    } else {
      alert('No se encontraron boletos con estos datos.')
    }
  } catch (e) {
    alert('Error recuperando tus boletos.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#131313] flex items-center justify-center p-6 relative overflow-hidden">
    <!-- Glow effect -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none"></div>
    
    <div class="max-w-md w-full bg-[#1a1a1a] rounded-3xl p-8 border border-gray-800 shadow-2xl relative z-10">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-violet-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
          <svg class="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
        </div>
        <h1 class="text-3xl font-black text-white mb-2">Recuperar Boletos</h1>
        <p class="text-gray-400 text-sm">Ingresa el correo y PIN de 6 dígitos que se mostraron tras tu compra.</p>
      </div>

      <form @submit.prevent="attemptRecovery" class="space-y-6">
        <BaseInput 
          label="Correo Electrónico" 
          type="email" 
          v-model="form.email" 
          required 
          placeholder="tu@correo.com" 
        />
        
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">PIN de Seguridad (6 dígitos)</label>
          <input 
            type="text" 
            v-model="form.pin" 
            required 
            maxlength="6"
            class="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-violet-500 transition-colors uppercase"
            placeholder="••••••"
          />
        </div>

        <BaseButton type="submit" variant="primary" :loading="loading" class="w-full py-4 text-lg mt-4">
          Buscar Boletos
        </BaseButton>
      </form>
    </div>
  </div>
</template>
