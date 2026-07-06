import type { User, Plan, Payment, ReferralStats, Device } from '../types';
import { getTelegramInitData } from '../auth/telegram';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const initData = getTelegramInitData();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Сервер не отвечает. Бэкенд может просыпаться...');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// Users
export async function getUser(telegramId: number): Promise<User> {
  return request<User>(`/users/${telegramId}`);
}

export async function registerUser(data: {
  telegram_id: number;
  username: string;
  first_name: string;
}): Promise<User> {
  return request<User>('/users/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function linkEmail(telegramId: number, email: string): Promise<void> {
  await request('/users/link-email', {
    method: 'POST',
    body: JSON.stringify({ telegram_id: telegramId, email }),
  });
}

export async function unlinkEmail(telegramId: number): Promise<void> {
  await request('/users/unlink-email', {
    method: 'POST',
    body: JSON.stringify({ telegram_id: telegramId }),
  });
}

export async function toggleAutoRenew(telegramId: number, enabled: boolean): Promise<void> {
  await request('/users/auto-renew', {
    method: 'POST',
    body: JSON.stringify({ telegram_id: telegramId, enabled }),
  });
}

// Plans
export async function getPlans(): Promise<Plan[]> {
  return request<Plan[]>('/plans');
}

// Payments
export async function createPayment(data: {
  user_id: number;
  amount: number;
  description: string;
}): Promise<{ payment_id: number; payment_url?: string }> {
  return request<{ payment_id: number; payment_url?: string }>('/payments/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function confirmPayment(paymentId: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/payments/confirm/${paymentId}`, { method: 'POST' });
}

export async function getPaymentHistory(userId: number): Promise<Payment[]> {
  return request<Payment[]>(`/payments/history/${userId}`);
}

// Referrals
export async function getReferralStats(telegramId: number): Promise<ReferralStats> {
  return request<ReferralStats>(`/users/referral/stats/${telegramId}`);
}

// Devices
export async function getDevices(userId: number): Promise<Device[]> {
  return request<Device[]>(`/users/${userId}/devices`);
}

export async function addDevice(userId: number, name: string, platform: string): Promise<Device> {
  return request<Device>(`/users/${userId}/devices`, {
    method: 'POST',
    body: JSON.stringify({ name, platform }),
  });
}

export async function removeDevice(userId: number, deviceId: number): Promise<void> {
  await request(`/users/${userId}/devices/${deviceId}`, { method: 'DELETE' });
}

export async function toggleDevice(userId: number, deviceId: number): Promise<Device> {
  return request<Device>(`/users/${userId}/devices/${deviceId}/toggle`, {
    method: 'POST',
  });
}
