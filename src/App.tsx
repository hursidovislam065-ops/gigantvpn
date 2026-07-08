import { useState, useEffect, useCallback, useRef } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import { OfflineBanner } from './components/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { Onboarding } from './components/Onboarding';
import { detectBot, isSpamming } from './utils/antiBot';
import { Home } from './pages/Home';
import { Subscription } from './pages/Subscription';
import { Referral } from './pages/Referral';
import { Support } from './pages/Support';
import { Settings } from './pages/Settings';
import { Devices } from './pages/Devices';
import { Documents } from './pages/Documents';
import { VpnSetup } from './pages/VpnSetup';
import { PaymentHistory } from './pages/PaymentHistory';
import { waitForTelegramUser, getTelegramUser, initTelegramWebApp, loadTelegramSDK } from './auth/telegram';
import { getUser, registerUser } from './api/client';
import type { PageId, User } from './types';

const MAX_HISTORY = 20;

export function App() {
  const [page, setPage] = useState<PageId>('home');
  const [prevPage, setPrevPage] = useState<PageId | null>(null);
  const [history, setHistory] = useState<PageId[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<'init' | 'waking'>('init');
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_done'));
  const [isBlocked, setIsBlocked] = useState(false);
  const currentPageRef = useRef<PageId>('home');

  const go = useCallback((p: PageId) => {
    const from = currentPageRef.current;
    currentPageRef.current = p;
    setHistory(prev => {
      const next = [...prev, from];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
    setPrevPage(from);
    setPage(p);
  }, []);

  const back = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      const target = prev[prev.length - 1];
      currentPageRef.current = target;
      setPage(target);
      setPrevPage(null);
      return next;
    });
  }, []);

  const refreshUserData = useCallback(async () => {
    setLoadError(null);

    // Load Telegram SDK first
    await loadTelegramSDK();
    initTelegramWebApp();

    // Give SDK a moment to initialize
    await new Promise(r => setTimeout(r, 500));

    const telegramId = await waitForTelegramUser(8000);
    const tgUser = getTelegramUser();

    if (!telegramId) {
      setLoadError('Не удалось определить Telegram ID. Откройте приложение через Telegram-бот.');
      setInitialLoading(false);
      return;
    }

    try {
      const user = await getUser(telegramId);
      setUserData(user);
    } catch (getUserErr) {
      console.log('getUser failed, trying register...', getUserErr);
      try {
        const user = await registerUser({
          telegram_id: telegramId,
          username: tgUser?.username || `user_${telegramId}`,
          first_name: tgUser?.first_name || 'Пользователь',
        });
        setUserData(user);
      } catch (registerErr) {
        console.error('registerUser also failed', registerErr);
        setLoadError('Сервер недоступен. Возможно, бэкенд просыпается — попробуйте через 30 секунд.');
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    // Anti-bot check
    const botCheck = detectBot();
    if (botCheck.isBot) {
      console.warn('Bot detected:', botCheck.reasons);
      setIsBlocked(true);
      return;
    }

    refreshUserData();
    const timer = setTimeout(() => setLoadingPhase('waking'), 4000);
    return () => clearTimeout(timer);
  }, [refreshUserData]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_done', 'true');
    setShowOnboarding(false);
  };

  // Bot blocked screen
  if (isBlocked) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', padding: '20px',
        background: '#050810',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(255, 107, 107, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="#FF6B6B" strokeWidth="1.5" fill="rgba(255,107,107,0.1)" />
            <path d="M12 8v4M12 16h.01" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#FF6B6B' }}>
          Доступ ограничен
        </h2>
        <p style={{ fontSize: '13px', opacity: 0.5, textAlign: 'center', maxWidth: '280px' }}>
          Обнаружена подозрительная активность. Откройте приложение через Telegram.
        </p>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
      }}>
        <div className="anim-pulse" style={{
          width: '72px', height: '72px',
          background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
          borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', fontWeight: 'bold', color: 'black',
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.5)',
          marginBottom: '16px',
        }}>G</div>
        <p style={{ fontSize: '14px', opacity: 0.5 }}>
          {loadingPhase === 'init' ? 'Загрузка...' : 'Бэкенд просыпается, подождите...'}
        </p>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home onNavigate={go} userData={userData} onRefresh={refreshUserData} loadError={loadError} />;
      case 'subscription':
        return <Subscription onBack={back} userId={userData?.id || 0} onPaymentSuccess={refreshUserData} />;
      case 'referral':
        return <Referral onBack={back} telegramId={userData?.telegram_id} />;
      case 'support':
        return <Support onBack={back} userId={userData?.id || 0} />;
      case 'settings':
        return <Settings onBack={back} onNavigate={go} userData={userData} onRefresh={refreshUserData} />;
      case 'devices':
        return <Devices onBack={back} userId={userData?.id || 0} userData={userData} onNavigate={go} onRefresh={refreshUserData} />;
      case 'documents':
        return <Documents onBack={back} />;
      case 'vpnsetup':
        return <VpnSetup onBack={back} userData={userData} />;
      case 'payment-history':
        return <PaymentHistory onBack={back} userId={userData?.id || 0} />;
      default:
        return <Home onNavigate={go} userData={userData} onRefresh={refreshUserData} loadError={loadError} />;
    }
  };

  return (
    <SettingsProvider>
      <ErrorBoundary>
        {showSplash && <SplashScreen onReady={() => setShowSplash(false)} />}
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <div className="animated-bg" />

        <div className="particles">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${(i * 7.3) % 100}%`,
                animationDelay: `${(i * 1.3) % 8}s`,
                animationDuration: `${8 + (i * 1.7) % 6}s`,
              }}
            />
          ))}
        </div>

        <OfflineBanner />

        <main style={{ animation: 'fadeIn 0.3s ease' }}>
          {renderPage()}
        </main>

        <BottomNav current={page} onChange={go} />
        <ToastContainer />
      </div>
      </ErrorBoundary>
    </SettingsProvider>
  );
}
