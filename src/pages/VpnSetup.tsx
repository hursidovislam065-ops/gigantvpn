import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { hapticFeedback } from '../utils/haptic';
import type { User } from '../types';

const platforms = [
  { id: 'ios', label: 'iPhone' },
  { id: 'android', label: 'Android' },
  { id: 'windows', label: 'Windows' },
  { id: 'macos', label: 'Mac' },
] as const;

const downloadLinks: Record<string, string> = {
  ios: 'https://apps.apple.com/app/id6473827591',
  android: 'https://play.google.com/store/search?q=happ+proxy+utility&c=apps',
  windows: 'https://github.com/happ-vpn/happ-windows/releases/latest',
  macos: 'https://apps.apple.com/app/id6473827591',
};

const PlatformIcon = ({ platform, size = 32 }: { platform: string; size?: number }) => {
  const icons: Record<string, React.ReactNode> = {
    ios: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke="#00D4FF" strokeWidth="1.5" fill="rgba(0,212,255,0.1)" />
        <circle cx="12" cy="19" r="1.5" stroke="#00D4FF" strokeWidth="1" />
        <line x1="9" y1="5" x2="15" y2="5" stroke="#00D4FF" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    android: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M5 11C5 7 8 4 12 4C16 4 19 7 19 11V17H5V11Z" stroke="#00E676" strokeWidth="1.5" fill="rgba(0,230,118,0.1)" />
        <rect x="3" y="11" width="3" height="7" rx="1.5" stroke="#00E676" strokeWidth="1.5" fill="rgba(0,230,118,0.1)" />
        <rect x="18" y="11" width="3" height="7" rx="1.5" stroke="#00E676" strokeWidth="1.5" fill="rgba(0,230,118,0.1)" />
        <circle cx="9" cy="8" r="1" fill="#00E676" />
        <circle cx="15" cy="8" r="1" fill="#00E676" />
      </svg>
    ),
    windows: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="18" rx="2" stroke="#0080FF" strokeWidth="1.5" fill="rgba(0,128,255,0.1)" />
        <rect x="4" y="5" width="8" height="8" rx="1" fill="rgba(0,128,255,0.15)" />
        <rect x="13" y="5" width="7" height="3.5" rx="1" fill="rgba(0,128,255,0.15)" />
        <rect x="13" y="9.5" width="7" height="3.5" rx="1" fill="rgba(0,128,255,0.15)" />
        <rect x="4" y="14.5" width="16" height="3.5" rx="1" fill="rgba(0,128,255,0.15)" />
      </svg>
    ),
    macos: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="13" rx="2" stroke="#8B95A7" strokeWidth="1.5" fill="rgba(139,149,167,0.1)" />
        <rect x="5" y="5" width="14" height="9" rx="1" fill="rgba(0,212,255,0.08)" />
        <rect x="9" y="16" width="6" height="2" rx="0.5" fill="rgba(139,149,167,0.3)" />
        <rect x="7" y="18" width="10" height="1" rx="0.5" fill="rgba(139,149,167,0.3)" />
      </svg>
    ),
  };
  return <>{icons[platform] || icons.ios}</>;
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

  const copyToClipboard = async () => {
    hapticFeedback('light');
    try {
      await navigator.clipboard.writeText(subscribeUrl);
      setCopied(true);
      hapticFeedback('success');
      addToast('success', 'Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      hapticFeedback('error');
      addToast('error', 'Не удалось скопировать');
    }
  };

  const openDownload = () => {
    hapticFeedback('medium');
    const link = downloadLinks[activeTab];
    if (link) window.open(link, '_blank');
  };

  const steps = [
    { num: '1', title: 'Скачайте Happ', desc: 'Установите приложение на устройство' },
    { num: '2', title: 'Добавьте подписку', desc: 'Скопируйте ссылку и вставьте в Happ' },
    { num: '3', title: 'Готово', desc: 'VPN подключён — пользуйтесь интернетом' },
  ];

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Настройка VPN</h1>
        </div>

        {/* Platform selector */}
        <div className="glass anim-up" style={{ padding: '6px', marginBottom: '16px', display: 'flex', gap: '4px' }}>
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => { hapticFeedback('light'); setActiveTab(p.id); }}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '14px',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                color: activeTab === p.id ? '#00D4FF' : '#6E7A8A',
                background: activeTab === p.id ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
                border: activeTab === p.id ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
                transition: 'all 0.3s',
              }}
            >
              <PlatformIcon platform={p.id} size={20} />
              <div style={{ marginTop: '4px' }}>{p.label}</div>
            </button>
          ))}
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {steps.map((step, i) => (
            <div key={i} className="glass anim-up" style={{
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px',
              animationDelay: `${i * 0.1}s`,
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,128,255,0.1))',
                border: '1px solid rgba(0,212,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#00D4FF', flexShrink: 0,
              }}>{step.num}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{step.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.5 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Download button */}
        <button onClick={openDownload} className="btn-primary anim-up stagger-3" style={{ marginBottom: '12px' }}>
          <span className="shimmer"></span>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Скачать Happ
          </span>
        </button>

        {/* Subscribe URL */}
        <div className="glass anim-up stagger-4" style={{ padding: '16px 20px', marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '8px' }}>Ваша ссылка подписки</p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0,0,0,0.2)', borderRadius: '12px',
            padding: '10px 14px', border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{
              fontSize: '11px', opacity: 0.7, wordBreak: 'break-all',
              fontFamily: 'monospace', flex: 1,
            }}>{subscribeUrl}</span>
            <button
              onClick={copyToClipboard}
              style={{
                padding: '8px 14px', borderRadius: '8px',
                background: copied ? 'rgba(0,230,118,0.2)' : 'rgba(0,212,255,0.15)',
                border: copied ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(0,212,255,0.2)',
                color: copied ? '#00E676' : '#00D4FF',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.3s', whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>

        {/* Bot link */}
        <div className="glass anim-up stagger-5" style={{
          padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Наш бот</div>
              <div style={{ fontSize: '12px', opacity: 0.5 }}>@gigantvpn_bot</div>
            </div>
          </div>
          <a
            href="https://t.me/gigantvpn_bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              color: '#000', fontWeight: 600, fontSize: '12px',
              textDecoration: 'none',
            }}
          >Перейти →</a>
        </div>
      </div>
    </div>
  );
}
