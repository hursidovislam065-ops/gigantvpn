import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { getDevices, addDevice, removeDevice, toggleDevice } from '../api/client';
import type { Device, PageId } from '../types';

const MAX_DEVICES = 5;

const platformIcons: Record<string, string> = {
  ios: '🍎',
  macos: '💻',
  windows: '🪟',
  android: '🤖',
  linux: '🐧',
  unknown: '📱',
};

export function Devices({ onBack, userId, onNavigate }: { onBack: () => void; userId: number; onNavigate: (p: PageId) => void }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getDevices(userId)
      .then(setDevices)
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const activeCount = devices.filter(d => d.is_active).length;

  const handleToggle = async (device: Device) => {
    try {
      const updated = await toggleDevice(userId, device.id);
      setDevices(prev => prev.map(d => d.id === device.id ? updated : d));
      addToast('success', updated.is_active ? 'Устройство подключено' : 'Устройство отключено');
    } catch {
      addToast('error', 'Ошибка');
    }
  };

  const handleRemove = async (device: Device) => {
    if (!confirm(`Удалить "${device.name}"?`)) return;
    try {
      await removeDevice(userId, device.id);
      setDevices(prev => prev.filter(d => d.id !== device.id));
      addToast('success', 'Устройство удалено');
    } catch {
      addToast('error', 'Ошибка удаления');
    }
  };

  const handleAdd = async () => {
    if (devices.length >= MAX_DEVICES) {
      addToast('warning', `Достигнут лимит (${MAX_DEVICES} устройств)`);
      return;
    }
    setAdding(true);
    try {
      const name = `Устройство ${devices.length + 1}`;
      const platform = detectPlatform();
      const device = await addDevice(userId, name, platform);
      setDevices(prev => [...prev, device]);
      addToast('success', 'Устройство добавлено');
    } catch {
      addToast('error', 'Ошибка добавления');
    } finally {
      setAdding(false);
    }
  };

  const detectPlatform = (): string => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad/.test(ua)) return 'ios';
    if (/mac/.test(ua)) return 'macos';
    if (/win/.test(ua)) return 'windows';
    if (/android/.test(ua)) return 'android';
    if (/linux/.test(ua)) return 'linux';
    return 'unknown';
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

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📱 Устройства</h1>
        </div>

        <div className="glass anim-up" style={{ padding: '16px 20px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Подключенные устройства</h2>
            <span style={{ fontSize: '13px', color: activeCount > 0 ? '#00E676' : '#8B95A7' }}>
              Активно: {activeCount}
            </span>
          </div>
          <span style={{ fontSize: '11px', opacity: 0.4 }}>
            {devices.length} из {MAX_DEVICES} устройств
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {devices.map(device => (
            <div key={device.id} className="glass anim-up" style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              borderColor: device.is_active ? 'rgba(0, 230, 118, 0.2)' : undefined,
              transition: 'all 0.3s',
            }}>
              <button
                onClick={() => handleToggle(device)}
                aria-label={device.is_active ? `Отключить ${device.name}` : `Подключить ${device.name}`}
                style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  border: device.is_active ? '2px solid #00D4FF' : '2px solid rgba(255,255,255,0.2)',
                  background: device.is_active ? 'rgba(0, 212, 255, 0.2)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.3s',
                  color: 'white', fontSize: '12px', padding: 0,
                }}
              >
                {device.is_active && '✓'}
              </button>

              <span style={{ fontSize: '20px' }}>
                {platformIcons[device.platform?.toLowerCase()] || '📱'}
              </span>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{device.name}</p>
                {device.is_active && (
                  <span style={{
                    fontSize: '9px', padding: '2px 8px', borderRadius: '10px',
                    background: 'rgba(0, 230, 118, 0.15)', color: '#00E676', fontWeight: 600,
                  }}>Активно</span>
                )}
              </div>

              <button
                onClick={() => handleRemove(device)}
                aria-label={`Удалить ${device.name}`}
                style={{
                  padding: '6px 10px', borderRadius: '8px',
                  background: 'rgba(255,107,107,0.1)', color: '#FF6B6B',
                  border: '1px solid rgba(255,107,107,0.2)',
                  cursor: 'pointer', fontSize: '12px',
                }}
              >✕</button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAdd}
          disabled={adding || devices.length >= MAX_DEVICES}
          className="btn-secondary anim-up"
          style={{
            borderStyle: 'dashed',
            opacity: devices.length >= MAX_DEVICES ? 0.4 : 1,
          }}
        >
          {adding ? '⏳ Добавление...' : `➕ Добавить устройство (${devices.length}/${MAX_DEVICES})`}
        </button>

        {devices.length >= MAX_DEVICES && (
          <p style={{ textAlign: 'center', fontSize: '12px', opacity: 0.4, marginTop: '12px' }}>
            🔒 Достигнут лимит устройств
          </p>
        )}
      </div>
    </div>
  );
}
