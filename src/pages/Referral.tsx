import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { getReferralStats } from '../api/client';
import type { ReferralStats } from '../types';

interface ReferralProps {
  onBack: () => void;
  telegramId?: number;
}

export function Referral({ onBack, telegramId }: ReferralProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const { data: stats, loading } = useApi<ReferralStats>(
    () => getReferralStats(telegramId!),
    [telegramId]
  );

  if (!telegramId) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ fontSize: '16px', opacity: 0.6 }}>Откройте через Telegram или добавьте ?dev_id=123 в URL</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
          <div className="anim-pulse" style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        </div>
      </div>
    );
  }

  const referralLink = stats?.referral_link || `https://t.me/gigantvpn_bot?start=ref_${telegramId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      addToast('success', 'Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('error', 'Не удалось скопировать');
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GigantVPN',
          text: 'Используй GigantVPN — быстрый и надёжный VPN! Переходи по ссылке:',
          url: referralLink,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>👥 Реферальная программа</h1>
        </div>

        <div className="glass-pro anim-up" style={{ padding: '24px 20px', marginBottom: '16px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', margin: '0 auto 12px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
          }}>🎁</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>
            Приглашай друзей и зарабатывай!
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.5, margin: '0 0 16px', lineHeight: 1.4 }}>
            Получай <strong style={{ color: '#00D4FF' }}>30%</strong> от каждого пополнения баланса твоими рефералами
          </p>

          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{
              fontSize: '12px', opacity: 0.7, wordBreak: 'break-all',
              fontFamily: 'monospace', flex: 1,
            }}>
              {referralLink}
            </span>
            <button
              onClick={copyLink}
              style={{
                padding: '8px 16px', borderRadius: '10px',
                background: copied ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 212, 255, 0.15)',
                border: copied ? '1px solid rgba(0, 230, 118, 0.3)' : '1px solid rgba(0, 212, 255, 0.2)',
                color: copied ? '#00E676' : '#00D4FF',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.3s',
              }}
            >
              {copied ? '✅ Скопировано' : '📋 Копировать'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div className="glass anim-up" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#00D4FF', margin: 0 }}>
              {loading ? '—' : stats?.total_referrals || 0}
            </p>
            <p style={{ fontSize: '11px', opacity: 0.5, margin: '4px 0 0' }}>Всего</p>
          </div>
          <div className="glass anim-up" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#00E676', margin: 0 }}>
              {loading ? '—' : stats?.active_referrals || 0}
            </p>
            <p style={{ fontSize: '11px', opacity: 0.5, margin: '4px 0 0' }}>Активных</p>
          </div>
          <div className="glass anim-up" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#FFD93D', margin: 0 }}>
              {loading ? '—' : `${stats?.total_earned || 0} ₽`}
            </p>
            <p style={{ fontSize: '11px', opacity: 0.5, margin: '4px 0 0' }}>Заработано</p>
          </div>
        </div>

        <button onClick={shareLink} className="btn-primary anim-up">
          <span className="shimmer" />
          📤 Поделиться ссылкой
        </button>
      </div>
    </div>
  );
}
