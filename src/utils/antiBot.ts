// Anti-bot protection: behavioral analysis and detection

interface BotScore {
  score: number; // 0-100, higher = more likely bot
  reasons: string[];
}

// Check if user agent looks like a bot
function isBotUserAgent(ua: string): boolean {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scrape/i,
    /curl/i, /wget/i, /python-requests/i, /headless/i,
    /phantom/i, /selenium/i, /puppeteer/i,
  ];
  return botPatterns.some(p => p.test(ua));
}

// Check touch support (bots usually don't have touch)
function hasTouchSupport(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Check screen dimensions (bots often have weird sizes)
function hasValidScreen(): boolean {
  return window.screen.width > 0 && window.screen.height > 0;
}

// Check if Telegram WebApp is present
function hasTelegramContext(): boolean {
  return !!(window as any).Telegram?.WebApp;
}

// Analyze behavior patterns
function analyzeBehavior(): BotScore {
  const reasons: string[] = [];
  let score = 0;

  // User agent check
  if (isBotUserAgent(navigator.userAgent)) {
    score += 40;
    reasons.push('bot_user_agent');
  }

  // No touch support on mobile
  if (!hasTouchSupport() && /Mobi|Android/i.test(navigator.userAgent)) {
    score += 20;
    reasons.push('no_touch_on_mobile');
  }

  // Invalid screen
  if (!hasValidScreen()) {
    score += 15;
    reasons.push('invalid_screen');
  }

  // No Telegram context
  if (!hasTelegramContext()) {
    score += 10;
    reasons.push('no_telegram_context');
  }

  // WebDriver flag (Selenium/Puppeteer)
  if ((navigator as any).webdriver) {
    score += 30;
    reasons.push('webdriver_detected');
  }

  // Missing plugins
  if (navigator.plugins.length === 0) {
    score += 10;
    reasons.push('no_plugins');
  }

  // Languages check
  if (!navigator.language || navigator.languages.length === 0) {
    score += 5;
    reasons.push('no_language');
  }

  return { score, reasons };
}

// Main check function
export function detectBot(): { isBot: boolean; score: number; reasons: string[] } {
  const result = analyzeBehavior();
  return {
    isBot: result.score >= 50,
    score: result.score,
    reasons: result.reasons,
  };
}

// Session fingerprint (changes per session, not unique tracking)
export function generateSessionFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Date.now().toString(36),
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// Track request frequency for spam detection
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 30;

export function isSpamming(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Remove old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }

  requestTimestamps.push(now);
  return requestTimestamps.length > MAX_REQUESTS_PER_MINUTE;
}
