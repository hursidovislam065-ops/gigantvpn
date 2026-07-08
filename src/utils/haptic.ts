export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light') {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg?.HapticFeedback) return;

  try {
    switch (type) {
      case 'light': tg.HapticFeedback.impactOccurred('light'); break;
      case 'medium': tg.HapticFeedback.impactOccurred('medium'); break;
      case 'heavy': tg.HapticFeedback.impactOccurred('heavy'); break;
      case 'success': tg.HapticFeedback.notificationOccurred('success'); break;
      case 'error': tg.HapticFeedback.notificationOccurred('error'); break;
      case 'warning': tg.HapticFeedback.notificationOccurred('warning'); break;
    }
  } catch (e) {}
}
