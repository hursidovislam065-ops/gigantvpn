export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 2) {
    return { valid: false, error: 'Минимум 2 символа' };
  }
  if (username.length > 32) {
    return { valid: false, error: 'Максимум 32 символа' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Только латиница, цифры и _' };
  }
  return { valid: true };
}

export function validateDeviceName(name: string): { valid: boolean; error?: string } {
  if (!name || name.length < 1) {
    return { valid: false, error: 'Введите название' };
  }
  if (name.length > 50) {
    return { valid: false, error: 'Максимум 50 символов' };
  }
  return { valid: true };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential XSS
    .trim();
}

export function isValidPaymentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowed = ['yookassa.ru', 'stripe.com', 'example.com', 'play.google.com'];
    return allowed.some(d => parsed.hostname.endsWith(d));
  } catch {
    return false;
  }
}

export function isValidTelegramId(id: any): boolean {
  return typeof id === 'number' && id > 0 && id <= 9999999999;
}
