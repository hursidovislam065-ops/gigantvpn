import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { getDevices, addDevice, removeDevice, toggleDevice } from '../api/client';
import { hapticFeedback } from '../utils/haptic';
import type { Device, User, PageId } from '../types';

const PLATFORMS = [
  { id: 'ios', label: 'iPhone', desc: 'iOS 15+' },
  { id: 'android', label: 'Android', desc: 'Android 8+' },
  { id: 'windows', label: 'Windows', desc: 'Windows 10+' },
  { id: 'macos', label: 'Mac', desc: 'macOS 12+' },
] as const;

const PlatformIcon = ({ platform, size = 28 }: { platform: string; size?: number }) => {
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
        <rect x="8" y="17" width="3" height="5" rx="1.5" stroke="#00E676" strokeWidth="1.5" fill="rgba(0,230,118,0.1)" />
        <rect x="13" y="17" width="3" height="5" rx="1.5" stroke="#00E676" strokeWidth="1.5" fill="rgba(0,230,118,0.1)" />
        <circle cx="9" cy="8" r="1" fill="#00E676" />
        <circle cx="15" cy="8" r="1" fill="#00E676" />
        <path d="M8 2L10 5M16 2L14 5" stroke="#00E676" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    windows: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="18" rx="2" stroke="#0080FF" strokeWidth="1.5" fill="rgba(0,128,255,0.1)" />
        <rect x="4" y="5" width="8" height="8" rx="1" stroke="#0080FF" strokeWidth="1" fill="rgba(0,128,255,0.15)" />
        <rect x="13" y="5" width="7" height="3.5" rx="1" stroke="#0080FF" strokeWidth="1" fill="rgba(0,128,255,0.15)" />
        <rect x="13" y="9.5" width="7" height="3.5" rx="1" stroke="#0080FF" strokeWidth="1" fill="rgba(0,128,255,0.15)" />
        <rect x="4" y="14.5" width="16" height="3.5" rx="1" stroke="#0080FF" strokeWidth="1" fill="rgba(0,128,255,0.15)" />
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

const CheckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface DevicesProps {
  onBack: () => void;
  userId: number;
  userData: User | null;
  onNavigate: (page: PageId) => void;
  onRefresh: () => void;
}

export function Devices({ onBack, userId, userData, onRefresh }: DevicesProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addToast } = useToast();

  const deviceLimit = userData?.device_limit || 3;
  const activeCount = devices.filter(d => d.is_active).length;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getDevices(userId)
      .then(setDevices)
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAdd = async (platform: string, name: string) => {
    if (devices.length >= deviceLimit) {
      hapticFeedback('warning');
      addToast('warning', `Достигнут лимит (${deviceLimit} устройств)`);
      return;
    }
    setAdding(true);
    try {
      const device = await addDevice(userId, name, platform);
      setDevices(prev => [...prev, device]);
      hapticFeedback('success');
      addToast('success', `${name} добавлено`);
      setShowAdd(false);
    } catch {
      hapticFeedback('error');
      addToast('error', 'Ошибка добавления');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (device: Device) => {
    hapticFeedback('medium');
    try {
      await removeDevice(userId, device.id);
      setDevices(prev => prev.filter(d => d.id !== device.id));
      hapticFeedback('success');
      addToast('success', 'Устройство удалено');
    } catch {
      hapticFeedback('error');
      addToast('error', 'Ошибка удаления');
    }
  };

  const handleToggle = async (device: Device) => {
    hapticFeedback('light');
    try {
      const updated = await toggleDevice(userId, device.id);
      setDevices(prev => prev.map(d => d.id === device.id ? updated : d));
      hapticFeedback('success');
    } catch {
      hapticFeedback('error');
      addToast('error', 'Ошибка');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '60px' }}>
          <div className="anim-pulse" style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ fontSize: '16px', opacity: 0.6 }}>Откройте через Telegram</p>
        </div>
      </div>
    );
  }

  // Device type selection screen
  if (showAdd) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => setShowAdd(false)} className="btn-back">←</button>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Добавить</h1>
          </div>

          <p className="text-gray anim-up" style={{ fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
            Выберите тип устройства
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {PLATFORMS.map((platform, i) => (
              <button
                key={platform.id}
                onClick={() => handleAdd(platform.id, platform.label)}
                disabled={adding}
                className="glass anim-up"
                style={{
                  padding: '20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: adding ? 'not-allowed' : 'pointer',
                  opacity: adding ? 0.6 : 1,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,128,255,0.08))',
                  border: '1px solid rgba(0,212,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <PlatformIcon platform={platform.id} size={32} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{platform.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.5 }}>{platform.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main devices list
  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Устройства</h1>
        </div>

        {/* Device counter */}
        <div className="glass-pro anim-up" style={{ padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Подключённые</span>
            <span style={{
              fontSize: '14px', fontWeight: 700,
              color: devices.length >= deviceLimit ? '#FF6B6B' : '#00D4FF',
            }}>
              {devices.length} / {deviceLimit}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{
            width: '100%', height: '4px', borderRadius: '2px',
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(devices.length / deviceLimit) * 100}%`,
              height: '100%', borderRadius: '2px',
              background: devices.length >= deviceLimit
                ? 'linear-gradient(90deg, #FF6B6B, #FF8E8E)'
                : 'linear-gradient(90deg, #00D4FF, #0080FF)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ fontSize: '11px', opacity: 0.4, margin: '8px 0 0' }}>
            Активно: {activeCount}
          </p>
        </div>

        {/* Devices list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {devices.map((device, i) => (
            <div
              key={device.id}
              className="glass anim-up"
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderColor: device.is_active ? 'rgba(0,230,118,0.2)' : undefined,
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {/* Toggle */}
              <button
                onClick={() => handleToggle(device)}
                style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  border: device.is_active ? '2px solid #00D4FF' : '2px solid rgba(255,255,255,0.2)',
                  background: device.is_active ? 'rgba(0,212,255,0.2)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.3s', flexShrink: 0,
                  color: 'white', padding: 0,
                }}
              >
                {device.is_active && <CheckIcon />}
              </button>

              {/* Platform icon */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PlatformIcon platform={device.platform} size={24} />
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{device.name}</div>
                {device.is_active && (
                  <span style={{
                    fontSize: '9px', padding: '2px 8px', borderRadius: '10px',
                    background: 'rgba(0,230,118,0.15)', color: '#00E676', fontWeight: 600,
                    display: 'inline-block', marginTop: '4px',
                  }}>Подключено</span>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleRemove(device)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'rgba(255,107,107,0.1)',
                  border: '1px solid rgba(255,107,107,0.2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FF6B6B', padding: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {devices.length === 0 && (
          <div className="glass anim-up" style={{ padding: '40px 20px', textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'iconFloat 3s ease-in-out infinite' }}>
              <PlatformIcon platform="ios" size={48} />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Нет устройств</p>
            <p style={{ fontSize: '12px', opacity: 0.5 }}>Добавьте устройство для подключения к VPN</p>
          </div>
        )}

        {/* Add button */}
        <button
          onClick={() => { hapticFeedback('light'); setShowAdd(true); }}
          className="btn-secondary anim-up"
          style={{
            borderStyle: 'dashed',
            opacity: devices.length >= deviceLimit ? 0.5 : 1,
            marginTop: devices.length === 0 ? '0' : '8px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить устройство
          </span>
        </button>

        {devices.length >= deviceLimit && (
          <p style={{ textAlign: 'center', fontSize: '12px', opacity: 0.4, marginTop: '12px' }}>
            Достигнут лимит устройств
          </p>
        )}
      </div>
    </div>
  );
}
