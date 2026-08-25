import type { RegisterTenantDto, LoginDto, CreateMemberDto } from '../types/api.types';

// En el futuro, configuraremos axios:
// import axios from 'axios';
// const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const AuthService = {
  async registerTenant(data: RegisterTenantDto) {
    // MOCK IMPLEMENTATION
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockTenant = { id: 'tenant-123', name: data.tenantName };
        const mockUser = { id: 'user-123', email: data.adminEmail, role: 'ADMIN', tenantId: mockTenant.id };
        
        // Simular que lo guardamos en BD
        localStorage.setItem('mock_tenant', JSON.stringify(mockTenant));
        localStorage.setItem('mock_users', JSON.stringify([mockUser]));

        resolve({ tenant: mockTenant, user: mockUser });
      }, 800);
    });
    
    // FUTURE IMPLEMENTATION
    // const response = await api.post('/auth/register-tenant', data);
    // return response.data;
  },

  async login(data: LoginDto) {
    // MOCK IMPLEMENTATION
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const usersStr = localStorage.getItem('mock_users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const user = users.find((u: any) => u.email === data.email);
        
        if (user) {
          const fakeToken = `jwt-token-for-${user.id}`;
          resolve({ access_token: fakeToken, user });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });

    // FUTURE IMPLEMENTATION
    // const response = await api.post('/auth/login', data);
    // return response.data;
  },

  async createMember(data: CreateMemberDto) {
    // MOCK IMPLEMENTATION
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersStr = localStorage.getItem('mock_users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const newUser = { id: `user-${Date.now()}`, email: data.email, role: data.role, tenantId: 'tenant-123' };
        users.push(newUser);
        localStorage.setItem('mock_users', JSON.stringify(users));
        resolve(newUser);
      }, 600);
    });

    // FUTURE IMPLEMENTATION
    // const response = await api.post('/auth/create-member', data);
    // return response.data;
  },
  
  // Endpoints adicionales que el backend necesitará implementar luego:
  async listMembers() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersStr = localStorage.getItem('mock_users');
        resolve(usersStr ? JSON.parse(usersStr) : []);
      }, 400);
    });
  }
};
