export interface RegisterTenantDto {
  tenantName: string;
  adminEmail: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateMemberDto {
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
}

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  tenantId: string;
}
