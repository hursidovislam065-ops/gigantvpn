import type { User, Plan, Payment, ReferralStats, Device } from '../types';
import { supabase } from './supabase';
import { checkRateLimit, rateLimits } from '../utils/rateLimit';
import { validateEmail, validateDeviceName, sanitizeInput, isValidPaymentUrl, isValidTelegramId } from '../utils/validation';
import { isSpamming } from '../utils/antiBot';

// Users
export async function getUser(telegramId: number): Promise<User> {
  if (!isValidTelegramId(telegramId)) throw new Error('Invalid Telegram ID');
  if (isSpamming()) throw new Error('Слишком много запросов. Подождите');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error || !data) throw new Error('User not found');
  return data;
}

export async function registerUser(data: {
  telegram_id: number;
  username: string;
  first_name: string;
}): Promise<User> {
  if (!isValidTelegramId(data.telegram_id)) throw new Error('Invalid Telegram ID');
  if (!checkRateLimit('register', rateLimits.register)) {
    throw new Error('Слишком много попыток. Подождите немного');
  }

  // Check if user exists
  const existing = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', data.telegram_id)
    .single();

  if (existing.data) return existing.data;

  // Auto-register: give 3-day trial with 3 devices
  const subscriptionUntil = new Date();
  subscriptionUntil.setDate(subscriptionUntil.getDate() + 3);

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      telegram_id: data.telegram_id,
      username: sanitizeInput(data.username),
      first_name: sanitizeInput(data.first_name),
      subscription_until: subscriptionUntil.toISOString(),
      device_limit: 3,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return newUser;
}

export async function linkEmail(telegramId: number, email: string): Promise<void> {
  if (!isValidTelegramId(telegramId)) throw new Error('Invalid Telegram ID');
  if (!validateEmail(email)) throw new Error('Некорректный email');
  if (!checkRateLimit('email', rateLimits.email)) {
    throw new Error('Слишком много попыток. Подождите');
  }

  const { error } = await supabase
    .from('users')
    .update({ email: sanitizeInput(email) })
    .eq('telegram_id', telegramId);

  if (error) throw new Error(error.message);
}

export async function unlinkEmail(telegramId: number): Promise<void> {
  if (!isValidTelegramId(telegramId)) throw new Error('Invalid Telegram ID');

  const { error } = await supabase
    .from('users')
    .update({ email: null })
    .eq('telegram_id', telegramId);

  if (error) throw new Error(error.message);
}

export async function toggleAutoRenew(telegramId: number, enabled: boolean): Promise<void> {
  if (!isValidTelegramId(telegramId)) throw new Error('Invalid Telegram ID');

  const { error } = await supabase
    .from('users')
    .update({ auto_renew: enabled })
    .eq('telegram_id', telegramId);

  if (error) throw new Error(error.message);
}

// Plans
export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*');

  if (error) throw new Error(error.message);
  return data || [];
}

// Payments
export async function createPayment(data: {
  user_id: number;
  amount: number;
  description: string;
}): Promise<{ payment_id: number; payment_url?: string }> {
  if (!checkRateLimit('payment', rateLimits.payment)) {
    throw new Error('Слишком много попыток оплаты. Подождите');
  }
  if (data.amount <= 0 || data.amount > 100000) {
    throw new Error('Некорректная сумма');
  }

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      user_id: data.user_id,
      amount: data.amount,
      description: sanitizeInput(data.description),
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { payment_id: payment.id, payment_url: undefined };
}

export async function confirmPayment(paymentId: number): Promise<{ success: boolean }> {
  const { error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'completed' })
    .eq('id', paymentId);

  if (paymentError) throw new Error(paymentError.message);

  // Get payment details to activate subscription
  const { data: payment } = await supabase
    .from('payments')
    .select('user_id, amount')
    .eq('id', paymentId)
    .single();

  if (payment) {
    const { data: user } = await supabase
      .from('users')
      .select('subscription_until')
      .eq('id', payment.user_id)
      .single();

    const baseDate = user?.subscription_until && new Date(user.subscription_until) > new Date()
      ? new Date(user.subscription_until)
      : new Date();

    const daysToAdd = Math.ceil(payment.amount / 50);
    baseDate.setDate(baseDate.getDate() + daysToAdd);

    await supabase
      .from('users')
      .update({ subscription_until: baseDate.toISOString() })
      .eq('id', payment.user_id);
  }

  return { success: true };
}

export async function getPaymentHistory(userId: number): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Referrals
export async function getReferralStats(telegramId: number): Promise<ReferralStats> {
  if (!isValidTelegramId(telegramId)) throw new Error('Invalid Telegram ID');

  const { data: user } = await supabase
    .from('users')
    .select('referral_code')
    .eq('telegram_id', telegramId)
    .single();

  const referralLink = `https://t.me/gigantvpn_bot?start=ref_${user?.referral_code || telegramId}`;

  const { data: referrals } = await supabase
    .from('users')
    .select('id')
    .eq('referred_by', telegramId);

  return {
    total_referrals: referrals?.length || 0,
    active_referrals: referrals?.length || 0,
    total_earned: 0,
    referral_link: referralLink,
  };
}

// Devices
export async function getDevices(userId: number): Promise<Device[]> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function addDevice(userId: number, name: string, platform: string): Promise<Device> {
  if (!checkRateLimit('deviceAdd', rateLimits.deviceAdd)) {
    throw new Error('Слишком много попыток. Подождите');
  }
  const nameValidation = validateDeviceName(name);
  if (!nameValidation.valid) throw new Error(nameValidation.error);

  const { data, error } = await supabase
    .from('devices')
    .insert({
      user_id: userId,
      name: sanitizeInput(name),
      platform,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('Device limit reached')) {
      throw new Error('Достигнут лимит устройств');
    }
    throw new Error(error.message);
  }
  return data;
}

export async function removeDevice(userId: number, deviceId: number): Promise<void> {
  if (!checkRateLimit('deviceRemove', rateLimits.deviceRemove)) {
    throw new Error('Слишком много попыток. Подождите');
  }

  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', deviceId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function toggleDevice(userId: number, deviceId: number): Promise<Device> {
  const { data: device } = await supabase
    .from('devices')
    .select('is_active')
    .eq('id', deviceId)
    .single();

  const { data, error } = await supabase
    .from('devices')
    .update({ is_active: !device?.is_active })
    .eq('id', deviceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
