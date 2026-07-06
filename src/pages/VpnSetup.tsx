import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import type { User } from '../types';

const platforms = [
  { id: 'ios', label: 'iOS', icon: '🍎' },
  { id: 'macos', label: 'MacOS', icon: '💻' },
  { id: 'windows', label: 'Windows', icon: '🪟' },
  { id: 'android', label: 'Android', icon: '🤖' },
] as const;

const downloadLinks: Record<string, string> = {
  ios: 'https://apps.apple.com/app/happ-vpn/id6473827591',
  macos: 'https://apps.apple.com/app/happ-vpn/id6473827591',
  windows: 'https://github.com/happ-vpn/happ-windows/releases/latest',
  android: 'https://play.google.com/store/apps/details?id=com.happ.vpn',
};

interface VpnSetupProps {
  onBack: () => void;
  userData: User | null;
}

export function VpnSetup({ onBack, userData }: VpnSetupProps) {
  const [activeTab, setActiveTab] = useState('ios');
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const subscribeUrl = userData?.id
    ? `https://subs.example.com/${userData.id}`
    : 'https://subs.example.com/subscribe';

  const botLink = 'https://t.me/gigantvpn_bot';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(subscribeUrl);
      setCopied(true);
      addToast('success', 'Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('error', 'Не удалось скопировать');
    }
  };

  const openDownload = () => {
    const link = downloadLinks[activeTab];
    if (link) {
      window.open(link, '_blank');
    } else {
      addToast('warning', 'Ссылка временно недоступна');
    }
  };

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🌐 VPN</h1>
        </div>

        {/* Platform Tabs */}
        <div className="glass" style={{ padding: '8px', marginBottom: '20px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '14px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                color: activeTab === p.id ? '#00D4FF' : '#6E7A8A',
                background: activeTab === p.id ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
                border: activeTab === p.id ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
                transition: 'all 0.3s',
              }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {/* Step 1: Download */}
        <div className="glass-pro anim-up" style={{ padding: '20px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)', color: 'black',
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800, flexShrink: 0, marginTop: '2px',
            }}>1</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>
                Скачайте приложение <span style={{ color: '#00D4FF' }}>Happ</span>
              </h3>
              <p style={{ fontSize: '12px', opacity: 0.5, margin: '0 0 12px', lineHeight: 1.4 }}>
                Установите приложение на устройство
              </p>
              <button onClick={openDownload} className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
                ⬇️ Скачать Happ
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Add Subscription */}
        <div className="glass anim-up" style={{ padding: '20px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.08)', color: 'white',
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800, flexShrink: 0, marginTop: '2px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>2</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Добавьте подписку</h3>
              <p style={{ fontSize: '12px', opacity: 0.5, margin: '0 0 12px', lineHeight: 1.4 }}>
                Скопируйте ссылку и вставьте в приложение
              </p>
              <div style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '10px 14px',
                marginBottom: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '8px',
                border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{
                  fontSize: '11px', opacity: 0.7, wordBreak: 'break-all',
                  fontFamily: 'monospace', flex: 1,
                }}>
                  {subscribeUrl}
                </span>
                <button onClick={copyToClipboard} style={{
                  padding: '6px 14px', borderRadius: '8px',
                  background: copied ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 212, 255, 0.15)',
                  border: copied ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(0, 212, 255, 0.2)',
                  color: copied ? '#00E676' : '#00D4FF',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.3s',
                }}>
                  {copied ? '✅' : '📋'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Done */}
        <div className="glass anim-up" style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{
              background: 'rgba(0, 230, 118, 0.2)', color: '#00E676',
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800, flexShrink: 0, marginTop: '2px',
              border: '1px solid rgba(0, 230, 118, 0.2)',
            }}>✓</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px', color: '#00E676' }}>
                Настройка завершена
              </h3>
              <p style={{ fontSize: '12px', opacity: 0.5, margin: 0, lineHeight: 1.4 }}>
                VPN подключен — пользуйтесь интернетом без ограничений
              </p>
            </div>
          </div>
        </div>

        {/* Bot Link */}
        <div className="glass" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Наш бот</p>
              <p style={{ fontSize: '11px', opacity: 0.4, margin: 0 }}>@gigantvpn_bot</p>
            </div>
          </div>
          <a
            href={botLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              color: '#000', fontWeight: 600, textDecoration: 'none',
              fontSize: '12px',
            }}
          >Перейти →</a>
        </div>
      </div>
    </div>
  );
}
