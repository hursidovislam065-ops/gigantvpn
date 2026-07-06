import { HomeSkeleton } from '../components/Skeleton';
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
              onClick={onRefresh}
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

  const balance = userData!.balance || 0;
  const subscriptionUntil = userData!.subscription_until;
  const isSubscribed = subscriptionUntil && new Date(subscriptionUntil) > new Date();
  const isTrial = userData!.is_trial && userData!.trial_ends_at && new Date(userData!.trial_ends_at) > new Date();

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
          <h1 className="anim-up" style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px', animationDelay: '0.1s' }}>
            GigantVPN
          </h1>
          <p className="text-gray anim-up" style={{ fontSize: '12px', margin: 0, animationDelay: '0.15s' }}>
            {userData!.first_name ? `Привет, ${userData!.first_name}!` : 'Быстрый и надёжный VPN'}
          </p>
        </div>

        {/* Trial Banner */}
        {isTrial && (
          <div className="anim-up" style={{
            padding: '14px 16px',
            marginBottom: '12px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(255, 217, 61, 0.1), rgba(255, 165, 0, 0.05))',
            border: '1px solid rgba(255, 217, 61, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>🎁</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#FFD93D', margin: 0 }}>Пробный период активен</p>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: '2px 0 0' }}>
                До {new Date(userData!.trial_ends_at!).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        )}

        {/* Balance */}
        <div className="glass anim-up" style={{ padding: '20px', marginBottom: '12px', textAlign: 'center', animationDelay: '0.2s' }}>
          <p className="text-gray" style={{ fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Баланс
          </p>
          <p style={{
            fontSize: '36px', fontWeight: 800, margin: 0,
            background: 'linear-gradient(135deg, #fff, #8B95A7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {balance}₽
          </p>
        </div>

        {/* Subscription Status */}
        <div className="glass anim-up" style={{ padding: '16px 20px', marginBottom: '16px', animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px' }}>{isSubscribed ? '✅' : '⚠️'}</span>
            <span style={{ color: isSubscribed ? '#00E676' : '#FF6B6B', fontSize: '13px', fontWeight: 600 }}>
              {isSubscribed ? `Подписка до ${new Date(subscriptionUntil!).toLocaleDateString('ru-RU')}` : 'Подписка не активна'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="tag">📱 {userData!.devices_count || 3} устройства</span>
            <span className="tag">⚡ {userData!.network || 'LTE'}</span>
            <span className="tag">∞ Безлимит</span>
            {userData!.auto_renew && <span className="tag" style={{ color: '#00E676' }}>🔄 Автопродление</span>}
          </div>
        </div>

        {/* CTA Buttons */}
        <button
          onClick={() => onNavigate('subscription')}
          className="btn-primary anim-up"
          style={{ animationDelay: '0.3s' }}
        >
          <span className="shimmer"></span>
          💳 {isSubscribed ? 'Продлить подписку' : 'Оплатить подписку'}
        </button>

        <button
          onClick={() => onNavigate('vpnsetup')}
          className="btn-secondary anim-up"
          style={{ marginTop: '10px', animationDelay: '0.35s' }}
        >
          📱 Настроить VPN
        </button>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          <div onClick={() => onNavigate('referral')} className="icon-card anim-up" style={{ animationDelay: '0.4s' }}>
            <div className="icon-wrap purple">👥</div>
            <div className="card-title">Пригласи друга</div>
            <div className="card-sub">Получи бонус</div>
          </div>
          <div onClick={() => onNavigate('support')} className="icon-card anim-up" style={{ animationDelay: '0.45s' }}>
            <div className="icon-wrap blue">🎧</div>
            <div className="card-title">Поддержка</div>
            <div className="card-sub">Напишите нам</div>
          </div>
        </div>
      </div>
    </div>
  );
}
