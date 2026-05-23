/**
 * Shared Type Definitions for the Impura Store App
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  features: string[];
  note: string;
}

export interface Order {
  id: string;
  product_id: string;
  qty: number;
  unit: number;
  amount_idr: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  voucher_code: string | null;
}

export interface Voucher {
  id: number;
  product_id: string;
  code: string;
  status: 'available' | 'used';
  created_at?: string;
}

export interface WarrantyOption {
  label: string;
  price: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface StatsResponse {
  ok: boolean;
  stock: Record<string, number>;
  sold: Record<string, number>;
  total_sold: number;
}

export interface OrderResponse {
  ok: boolean;
  order?: Order;
  status?: string;
  ttl_sec?: number;
}
