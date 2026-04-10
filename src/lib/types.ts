export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: "admin" | "manager";
  salon_name: string;
  salon_address: string | null;
  store_description: string | null;
  cnpj: string | null;
  owner_cpf: string | null;
  store_phone: string | null;
  store_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Professional {
  id: string;
  user_id: string | null;
  full_name: string;
  role_title: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: "active" | "away" | "inactive";
  commission_type: "percentage" | "fixed";
  commission_value: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  category_id: string | null;
  duration_minutes: number;
  price: number;
  description: string | null;
  online_booking: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: ServiceCategory;
}

export interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  cpf: string;
  birth_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_id: string | null;
  professional_id: string | null;
  service_id: string | null;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  professional?: Professional;
  service?: Service;
}

export interface InventoryProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string;
  stock_quantity: number;
  min_stock: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  payment_method: string | null;
  appointment_id: string | null;
  date: string;
  created_at: string;
}
