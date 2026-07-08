import { HomeSkeleton } from '../components/Skeleton';
import { hapticFeedback } from '../utils/haptic';
import type { PageId, User } from '../types';

interface HomeProps {
  onNavigate: (page: PageId) => void;
  userData: User | null;
  onRefresh: () => void;
  loadError?: string | null;
}

export function Home({ onNavigate, userData, onRefresh, loadError }: HomeProps) {
  if (!userData && !loadError) return <HomeSkeleton />;

  if (!userData && loadError) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '80px' }}>
          <div className="glass" style={{ padding: '32px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Ошибка загрузки</p>
            <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '20px', lineHeight: 1.5 }}>{loadError}</p>
            <button
              onClick={() => { hapticFeedback('medium'); onRefresh(); }}
              className="btn-primary"
              style={{ width: 'auto', padding: '14px 32px' }}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subscriptionUntil = userData!.subscription_until;
  const isSubscribed = subscriptionUntil && new Date(subscriptionUntil) > new Date();

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="glass-pro anim-up" style={{ padding: '32px 20px', marginBottom: '12px', textAlign: 'center' }}>
          <div className="anim-float" style={{
            width: '72px', height: '72px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
            borderRadius: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', fontWeight: 'bold', color: 'black',
            boxShadow: '0 0 40px rgba(0, 212, 255, 0.5), 0 8px 20px rgba(0, 212, 255, 0.3)',
          }}>G</div>
          <h1 className="gradient-text anim-up" style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px', animationDelay: '0.1s' }}>
            GigantVPN
          </h1>
          <p className="text-gray anim-up" style={{ fontSize: '12px', margin: 0, animationDelay: '0.15s' }}>
            {userData!.first_name ? `Привет, ${userData!.first_name}!` : 'Быстрый и надёжный VPN'}
          </p>
        </div>

        {/* Subscription Status */}
        <div className="glass anim-up stagger-2" style={{ padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: isSubscribed ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,107,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
            animation: isSubscribed ? 'iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'iconShake 0.5s ease',
          }}>
            {isSubscribed ? '✅' : '⚠️'}
          </div>
            <div>
              <div style={{ color: isSubscribed ? '#00E676' : '#FF6B6B', fontSize: '13px', fontWeight: 600 }}>
                {isSubscribed ? 'Подписка активна' : 'Подписка не активна'}
              </div>
              {isSubscribed && (
                <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>
                  До {new Date(subscriptionUntil!).toLocaleDateString('ru-RU')}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {userData!.auto_renew && (
              <span className="tag" style={{ color: '#00E676', borderColor: 'rgba(0,230,118,0.2)' }}>
                🔄 Автопродление
              </span>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <button
          onClick={() => { hapticFeedback('light'); onNavigate('subscription'); }}
          className="btn-primary anim-up stagger-3"
        >
          <span className="shimmer"></span>
          💳 {isSubscribed ? 'Продлить подписку' : 'Оплатить подписку'}
        </button>

        <button
          onClick={() => { hapticFeedback('light'); onNavigate('vpnsetup'); }}
          className="btn-secondary anim-up stagger-4"
          style={{ marginTop: '10px' }}
        >
          📱 Настроить VPN
        </button>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          <div onClick={() => { hapticFeedback('light'); onNavigate('referral'); }} className="icon-card anim-up stagger-4">
            <div className="icon-wrap purple" style={{ animation: 'iconFloat 3s ease-in-out infinite' }}>👥</div>
            <div className="card-title">Пригласи друга</div>
            <div className="card-sub">Получи бонус</div>
          </div>
          <div onClick={() => { hapticFeedback('light'); onNavigate('support'); }} className="icon-card anim-up stagger-5">
            <div className="icon-wrap blue" style={{ animation: 'iconFloat 3s ease-in-out infinite 0.5s' }}>🎧</div>
            <div className="card-title">Поддержка</div>
            <div className="card-sub">Напишите нам</div>
          </div>
        </div>
      </div>
    </div>
  );
}
