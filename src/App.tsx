import { useState, useEffect, useCallback, useRef } from 'react';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import { OfflineBanner } from './components/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
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
    refreshUserData();
    const timer = setTimeout(() => setLoadingPhase('waking'), 4000);
    return () => clearTimeout(timer);
  }, [refreshUserData]);

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
        return <Support onBack={back} />;
      case 'settings':
        return <Settings onBack={back} onNavigate={go} userData={userData} onRefresh={refreshUserData} />;
      case 'devices':
        return <Devices onBack={back} userId={userData?.id || 0} onNavigate={go} />;
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
    <ErrorBoundary>
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

        <main>
          {renderPage()}
        </main>

        <BottomNav current={page} onChange={go} />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
