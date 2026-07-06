interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    auth_date: number;
    hash: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  backButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
  };
  mainButton: {
    text: string;
    color: string;
    textColor: string;
    isActive: boolean;
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp || null;
}

export function getTelegramUser(): TelegramWebApp['initDataUnsafe']['user'] | null {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
}

export function getTelegramInitData(): string {
  const webApp = getTelegramWebApp();
  return webApp?.initData || '';
}

export function getTelegramLanguage(): string {
  return getTelegramUser()?.language_code || 'ru';
}

// Dev mode: use ?dev_id=123 URL param or localStorage 'dev_telegram_id'
export function getDevTelegramId(): number | null {
  const params = new URLSearchParams(window.location.search);
  const devId = params.get('dev_id');
  if (devId) {
    const id = parseInt(devId, 10);
    if (!isNaN(id)) {
      localStorage.setItem('dev_telegram_id', String(id));
      return id;
    }
  }
  const stored = localStorage.getItem('dev_telegram_id');
  if (stored) {
    const id = parseInt(stored, 10);
    if (!isNaN(id)) return id;
  }
  return null;
}

// Returns telegram user — from Telegram WebApp or from dev_id param
export function getEffectiveTelegramId(): number | null {
  const tgUser = getTelegramUser();
  if (tgUser?.id) return tgUser.id;
  return getDevTelegramId();
}

export function initTelegramWebApp() {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
    webApp.expand();
  }
}

// Wait for Telegram WebApp to initialize user data (up to 3 seconds)
export function waitForTelegramUser(timeoutMs = 3000): Promise<number | null> {
  return new Promise((resolve) => {
    // Immediately check
    const direct = getEffectiveTelegramId();
    if (direct) {
      resolve(direct);
      return;
    }

    // Poll for user data
    const start = Date.now();
    const interval = setInterval(() => {
      const id = getEffectiveTelegramId();
      if (id || Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve(id);
      }
    }, 100);
  });
}
