export interface User {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  email?: string;
  subscription_until?: string;
  auto_renew: boolean;
  referral_code?: string;
  device_limit: number;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  price_stars?: number;
}

export interface Payment {
  id: number;
  user_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string;
  created_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_earned: number;
  referral_link: string;
}

export interface Device {
  id: number;
  name: string;
  platform: string;
  is_active: boolean;
  last_active_at?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: number;
  ticket_id: number;
  sender: 'user' | 'admin';
  message: string;
  telegram_id?: number;
  is_read: boolean;
  created_at: string;
}

export type PageId = 'home' | 'subscription' | 'referral' | 'support' | 'settings' | 'devices' | 'documents' | 'vpnsetup' | 'payment-history' | 'chat';
