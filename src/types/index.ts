export interface User {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  email?: string;
  balance: number;
  subscription_until?: string;
  devices_count: number;
  network: string;
  is_trial: boolean;
  trial_ends_at?: string;
  auto_renew: boolean;
  created_at: string;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  days: number;
  badge?: string;
  per_day: string;
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
  referral_code: string;
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

export type PageId = 'home' | 'subscription' | 'referral' | 'support' | 'settings' | 'devices' | 'documents' | 'vpnsetup' | 'payment-history';
