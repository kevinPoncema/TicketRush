export interface RegisterTenantDto {
  tenantName: string;
  userName: string;
  userEmail: string;
  userPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateMemberDto {
  name: string;
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

export interface TicketTier {
  id: string;
  name: string;
  price: string;
  capacity: number;
  availableStock: number;
  description: string | null;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  bannerUrl?: string;
  ticketTiers: TicketTier[]
}

export interface OrderItem {
  ticketTierId: string;
  quantity: number;
}

export interface CreateOrderDto {
  clientEmail: string;
  clientName: string;
  tiers: OrderItem[];
}

export interface RecoverOrderDto {
  email: string;
  accessPin: string;
}
