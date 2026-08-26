<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-[#131313] text-white flex flex-col font-sans selection:bg-violet-500/30">
    
    <!-- Navbar -->
    <header class="flex items-center justify-between px-8 py-6 border-b border-gray-800/50 backdrop-blur-md sticky top-0 z-50">
      <div class="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">
        VANTAGE
      </div>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
        <a href="#features" class="hover:text-white transition-colors">Características</a>
        <a href="#staff" class="hover:text-white transition-colors">Para Staff</a>
      </nav>
      <div class="flex items-center gap-4">
        <router-link to="/auth/login" class="text-sm font-bold text-gray-300 hover:text-white transition-colors">
          Iniciar Sesión
        </router-link>
        <router-link to="/auth/register" class="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-transform hover:scale-105">
          Crear Cuenta
        </router-link>
      </div>
    </header>

    <!-- Hero Section -->
    <main class="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold tracking-wide uppercase mb-8">
        <span class="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
        El motor de ticketing B2B
      </div>

      <h1 class="text-6xl md:text-8xl font-black tracking-tighter leading-tight max-w-5xl mb-8">
        Vende boletos con <br/>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-500 to-white">cero fricción.</span>
      </h1>
      
      <p class="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
        Plataforma minimalista de alta conversión. Sin envíos de correos, sin fricción. Almacenamiento persistente en dispositivo y recuperación segura por PIN para tus compradores.
      </p>

      <div class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <router-link to="/auth/register" class="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)]">
          Comenzar ahora
        </router-link>
        <router-link to="/scanner" class="w-full sm:w-auto bg-[#1a1a1a] border border-gray-700 hover:border-gray-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          Escáner Móvil (Staff)
        </router-link>
      </div>
    </main>

    <!-- Features Mini -->
    <section id="features" class="border-t border-gray-800/50 bg-[#0a0a0a] py-20 px-8">
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div class="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h3 class="text-xl font-bold mb-3">Alta Conversión</h3>
          <p class="text-gray-400 leading-relaxed">Diseño brutalista centrado exclusivamente en vender más rápido. Sistema de urgencia temporal en el checkout.</p>
        </div>
        <div>
           <div class="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h3 class="text-xl font-bold mb-3">Seguridad Anti-Fricción</h3>
          <p class="text-gray-400 leading-relaxed">Las entradas nunca se envían por correo. Se recuperan localmente vía caché o de forma segura con un PIN estático.</p>
        </div>
        <div id="staff">
           <div class="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 class="text-xl font-bold mb-3">Staff Nativo</h3>
          <p class="text-gray-400 leading-relaxed">Validación criptográfica asíncrona que funciona en la puerta, con pantalla de estado ultrarrápida (verde/roja).</p>
        </div>
      </div>
    </section>

  </div>
</template>
