import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { linkEmail, unlinkEmail, toggleAutoRenew } from '../api/client';
import { hapticFeedback } from '../utils/haptic';
import { useSettings } from '../contexts/SettingsContext';
import type { PageId, User } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

interface SettingsProps {
  onBack: () => void;
  onNavigate: (page: PageId) => void;
  userData: User | null;
  onRefresh: () => void;
}

export function Settings({ onBack, onNavigate, userData, onRefresh }: SettingsProps) {
  const { theme, fontSize, language, setTheme, setFontSize, setLanguage } = useSettings();
  const [emailValue, setEmailValue] = useState(userData?.email || '');
  const [emailLinked, setEmailLinked] = useState(!!userData?.email);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [notifications, setNotifications] = useState(() => localStorage.getItem('notifications') !== 'false');
  const [autoRenew, setAutoRenew] = useState(userData?.auto_renew || false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const isSubscribed = userData?.subscription_until && new Date(userData.subscription_until) > new Date();

  const handleLink = async () => {
    hapticFeedback('medium');
    if (!emailValue || !EMAIL_REGEX.test(emailValue) || emailValue.length > EMAIL_MAX_LENGTH) {
      addToast('error', 'Введите корректный email');
      return;
    }
    setLoading(true);
    try {
      await linkEmail(userData!.telegram_id, emailValue);
      setEmailLinked(true);
      setShowEmailInput(false);
      addToast('success', 'Email привязан');
      onRefresh();
    } catch {
      addToast('error', 'Ошибка привязки email');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Отвязать email?')) return;
    setLoading(true);
    try {
      await unlinkEmail(userData!.telegram_id);
      setEmailValue('');
      setEmailLinked(false);
      addToast('success', 'Email отвязан');
      onRefresh();
    } catch {
      addToast('error', 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRenew = async () => {
    if (!userData) return;
    setLoading(true);
    try {
      await toggleAutoRenew(userData.telegram_id, !autoRenew);
      setAutoRenew(!autoRenew);
      hapticFeedback('success');
      addToast('success', autoRenew ? 'Автопродление отключено' : 'Автопродление включено');
      onRefresh();
    } catch {
      hapticFeedback('error');
      addToast('error', 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeClick = (t: 'dark' | 'light') => {
    hapticFeedback('light');
    setTheme(t);
    addToast('info', t === 'dark' ? 'Тёмная тема' : 'Светлая тема');
  };

  const handleLanguageClick = (l: 'ru' | 'en') => {
    hapticFeedback('light');
    setLanguage(l);
    addToast('info', l === 'ru' ? 'Русский язык' : 'English');
  };

  const handleFontSizeClick = (s: 'small' | 'medium' | 'large') => {
    hapticFeedback('light');
    setFontSize(s);
  };

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '20px', padding: '8px 0' }}>
          <button onClick={onBack} className="btn-back" style={{ position: 'absolute', left: 0 }}>←</button>
          <div className="glass" style={{ padding: '8px 24px', borderRadius: '20px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#8B95A7' }}>⚙</span> Настройки
            </h1>
          </div>
        </div>

        {/* Subscription */}
        <div className="glass-pro anim-up" style={{ padding: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, paddingRight: '12px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px' }}>Подписка</h2>
            <p className="text-gray" style={{ fontSize: '12px', margin: 0, lineHeight: 1.4 }}>
              {isSubscribed ? `Активна до ${new Date(userData!.subscription_until!).toLocaleDateString('ru-RU')}` : 'Не активна'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('subscription')}
            style={{
              padding: '8px 16px', borderRadius: '12px',
              background: 'rgba(0, 212, 255, 0.1)', color: '#00D4FF',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >Настроить →</button>
        </div>

        {/* Auto-renew */}
        <div className="glass anim-up" style={{ padding: '14px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'iconSpin 8s linear infinite' }}>🔄</span>
            <div>
              <span style={{ fontSize: '14px' }}>Автопродление</span>
              <p style={{ fontSize: '11px', opacity: 0.4, margin: '2px 0 0' }}>Продлевать подписку автоматически</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={autoRenew} onChange={handleAutoRenew} disabled={loading} />
            <span className={`toggle-slider${autoRenew ? ' active' : ''}`}></span>
          </label>
        </div>

        {/* Account */}
        <div className="glass anim-up" style={{ padding: '12px 0', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 20px 12px' }}>Аккаунт</h3>

          <div className="nav-item-row" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'iconBounce 2s ease-in-out infinite' }}>🔔</span>
              <span style={{ fontSize: '14px' }}>Уведомления</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
              <span className={`toggle-slider${notifications ? ' active' : ''}`}></span>
            </label>
          </div>

          <button onClick={() => onNavigate('devices')} className="nav-item-row">
            <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'iconFloat 3s ease-in-out infinite' }}>💻</span>
            <span style={{ flex: 1, fontSize: '14px' }}>Устройства</span>
            <span className="text-gray">→</span>
          </button>

          <button onClick={() => onNavigate('payment-history')} className="nav-item-row">
            <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'iconFloat 3s ease-in-out infinite 0.5s' }}>💳</span>
            <span style={{ flex: 1, fontSize: '14px' }}>История платежей</span>
            <span className="text-gray">→</span>
          </button>
        </div>

        {/* Email */}
        <div className="glass anim-up" style={{ padding: '12px 0', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 20px 12px' }}>Способы входа</h3>

          <div style={{ padding: '0 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: '12px',
              background: emailLinked ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255,255,255,0.02)',
              border: emailLinked ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'iconFloat 3s ease-in-out infinite' }}>📧</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', margin: 0 }}>Email</p>
                <p style={{ fontSize: '12px', opacity: 0.4, margin: 0 }}>
                  {emailLinked ? emailValue : 'Не привязан'}
                </p>
              </div>
              {!emailLinked ? (
                <button
                  onClick={() => setShowEmailInput(!showEmailInput)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px',
                    background: 'rgba(0, 212, 255, 0.1)', color: '#00D4FF',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  }}
                >Привязать</button>
              ) : (
                <button
                  onClick={handleUnlink}
                  disabled={loading}
                  style={{
                    padding: '6px 14px', borderRadius: '8px',
                    background: 'rgba(255,107,107,0.1)', color: '#FF6B6B',
                    border: '1px solid rgba(255,107,107,0.2)',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  }}
                >{loading ? '⏳' : 'Отвязать'}</button>
              )}
            </div>

            {showEmailInput && !emailLinked && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', padding: '0 12px' }}>
                <input
                  type="email"
                  value={emailValue}
                  onChange={e => setEmailValue(e.target.value)}
                  placeholder="Введите email"
                  maxLength={EMAIL_MAX_LENGTH}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white', fontSize: '14px', outline: 'none',
                  }}
                />
                <button
                  onClick={handleLink}
                  disabled={loading}
                  style={{
                    padding: '10px 16px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
                    color: '#000', border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: '13px',
                  }}
                >{loading ? '⏳' : '✅'}</button>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 16px', margin: '8px 16px 0', borderRadius: '12px',
            background: 'rgba(0, 212, 255, 0.05)',
            border: '1px solid rgba(0, 212, 255, 0.15)',
          }}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', color: 'black',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}>✈</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', margin: 0 }}>Telegram</p>
              <p style={{ fontSize: '12px', opacity: 0.4, margin: 0 }}>id: {userData?.telegram_id}</p>
            </div>
            <span style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: 'black', fontWeight: 700,
              boxShadow: '0 0 15px rgba(0, 212, 255, 0.5)',
              animation: 'iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>✓</span>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass anim-up" style={{ padding: '12px 0', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 20px 12px' }}>Внешний вид</h3>

          {/* Theme */}
          <div style={{ padding: '0 16px', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', opacity: 0.5, margin: '0 0 8px' }}>Тема</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['dark', 'light'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleThemeClick(t)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px',
                    background: theme === t ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                    border: theme === t ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    color: theme === t ? '#00D4FF' : '#6E7A8A',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >{t === 'dark' ? '🌙 Тёмная' : '☀️ Светлая'}</button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div style={{ padding: '0 16px', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', opacity: 0.5, margin: '0 0 8px' }}>Язык</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['ru', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => handleLanguageClick(l)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px',
                    background: language === l ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                    border: language === l ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    color: language === l ? '#00D4FF' : '#6E7A8A',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >{l === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}</button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div style={{ padding: '0 16px' }}>
            <p style={{ fontSize: '12px', opacity: 0.5, margin: '0 0 8px' }}>Размер шрифта</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['small', 'medium', 'large'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleFontSizeClick(s)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px',
                    background: fontSize === s ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                    border: fontSize === s ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    color: fontSize === s ? '#00D4FF' : '#6E7A8A',
                    fontSize: s === 'small' ? '11px' : s === 'large' ? '16px' : '13px',
                    fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >{s === 'small' ? 'Мелкий' : s === 'large' ? 'Крупный' : 'Стандарт'}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="glass anim-up" style={{ padding: '12px 0', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 20px 12px' }}>Информация</h3>

          <button onClick={() => onNavigate('documents')} className="nav-item-row">
            <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</span>
            <span style={{ flex: 1, fontSize: '14px' }}>Документы</span>
            <span className="text-gray">→</span>
          </button>

          <a
            href="https://t.me/gigantvpn_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item-row"
            style={{ textDecoration: 'none', marginTop: '4px' }}
          >
            <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💬</span>
            <span style={{ flex: 1, fontSize: '14px' }}>Поддержка</span>
            <span className="text-gray">↗</span>
          </a>

          <button
            className="nav-item-row"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'GigantVPN', text: 'Быстрый и надёжный VPN!', url: 'https://t.me/gigantvpn_bot' });
              }
            }}
          >
            <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📤</span>
            <span style={{ flex: 1, fontSize: '14px' }}>Поделиться</span>
            <span className="text-gray">→</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: '11px', opacity: 0.3, margin: '0 0 4px' }}>GigantVPN v{APP_VERSION || '2.2.0'}</p>
          <p style={{ fontSize: '10px', opacity: 0.2, margin: 0 }}>Сделано с ❤️ для безопасности</p>
        </div>
      </div>
    </div>
  );
}
