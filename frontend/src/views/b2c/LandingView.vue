<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-8">
    <div class="max-w-2xl w-full bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 shadow-2xl">
      
      <div class="text-center mb-10">
        <h1 class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600 mb-2">VANTAGE</h1>
        <p class="text-gray-400 text-lg">Directorio de Desarrollo (Navegación Rápida)</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <!-- B2B Routes -->
        <div class="space-y-4">
          <h2 class="text-xl font-bold text-gray-200 border-b border-gray-800 pb-2">🏢 Flujo Organizador (B2B)</h2>
          
          <router-link to="/auth/register" class="block bg-[#131313] hover:bg-gray-800 border border-gray-700 hover:border-violet-500 rounded-xl p-4 transition-all group">
            <h3 class="text-violet-400 font-semibold group-hover:text-violet-300">Registrar Productora</h3>
            <p class="text-sm text-gray-500 mt-1">/auth/register</p>
          </router-link>

          <router-link to="/auth/login" class="block bg-[#131313] hover:bg-gray-800 border border-gray-700 hover:border-violet-500 rounded-xl p-4 transition-all group">
            <h3 class="text-violet-400 font-semibold group-hover:text-violet-300">Iniciar Sesión</h3>
            <p class="text-sm text-gray-500 mt-1">/auth/login</p>
          </router-link>

          <router-link to="/b2b" class="block bg-[#131313] hover:bg-gray-800 border border-gray-700 hover:border-violet-500 rounded-xl p-4 transition-all group">
            <h3 class="text-violet-400 font-semibold group-hover:text-violet-300">Panel de Control (Dashboard)</h3>
            <p class="text-sm text-gray-500 mt-1">/b2b - Requiere Login</p>
          </router-link>
        </div>

        <!-- B2C Routes -->
        <div class="space-y-4">
          <h2 class="text-xl font-bold text-gray-200 border-b border-gray-800 pb-2">🎟️ Flujo Comprador (B2C)</h2>
          
          <router-link to="/checkout" class="block bg-[#131313] hover:bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl p-4 transition-all group">
            <h3 class="text-purple-400 font-semibold group-hover:text-purple-300">Pantalla de Checkout</h3>
            <p class="text-sm text-gray-500 mt-1">/checkout (Próximamente)</p>
          </router-link>

          <router-link to="/success" class="block bg-[#131313] hover:bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl p-4 transition-all group">
            <h3 class="text-purple-400 font-semibold group-hover:text-purple-300">Boleto Digital (Success)</h3>
            <p class="text-sm text-gray-500 mt-1">/success (Próximamente)</p>
          </router-link>
        </div>

      </div>

    </div>
  </div>
</template>
