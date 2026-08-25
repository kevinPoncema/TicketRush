import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthService } from '../services/auth.service';
import type { LoginDto, RegisterTenantDto, User } from '../types/api.types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('access_token'));

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  async function login(credentials: LoginDto) {
    try {
      const data: any = await AuthService.login(credentials);
      token.value = data.access_token;
      user.value = data.user;
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  }

  async function register(data: RegisterTenantDto) {
    try {
      await AuthService.registerTenant(data);
      // Auto login after register
      await login({ email: data.adminEmail, password: data.password });
    } catch (error) {
      throw error;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  // Hydrate state on load
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }

  return { user, token, isAuthenticated, isAdmin, login, register, logout };
});
