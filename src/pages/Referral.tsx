import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { getReferralStats } from '../api/client';
import { hapticFeedback } from '../utils/haptic';
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
          <p style={{ fontSize: '16px', opacity: 0.6 }}>Откройте через Telegram</p>
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
    hapticFeedback('light');
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      hapticFeedback('success');
      addToast('success', 'Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      hapticFeedback('error');
      addToast('error', 'Не удалось скопировать');
    }
  };

  const shareLink = async () => {
    hapticFeedback('light');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GigantVPN',
          text: 'Используй GigantVPN — быстрый и надёжный VPN!',
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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Рефералы</h1>
        </div>

        {/* Main card */}
        <div className="glass-pro anim-up" style={{ padding: '24px 20px', marginBottom: '16px', textAlign: 'center' }}>
          {/* Animated gift icon */}
          <div style={{
            width: '72px', height: '72px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,128,255,0.1))',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'iconFloat 3s ease-in-out infinite',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="8" width="18" height="4" rx="1.5" stroke="#00D4FF" strokeWidth="1.5" fill="rgba(0,212,255,0.15)" />
              <rect x="5" y="12" width="14" height="9" rx="1.5" stroke="#00D4FF" strokeWidth="1.5" fill="rgba(0,212,255,0.15)" />
              <path d="M12 8V21M12 8C12 8 12 5.5 9.5 4.5C8 4 7 5 7 6C7 7 8 8 12 8Z" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8C12 8 12 5.5 14.5 4.5C16 4 17 5 17 6C17 7 16 8 12 8Z" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>
            Приглашай друзей
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.5, margin: '0 0 16px', lineHeight: 1.5 }}>
            Получай <strong style={{ color: '#00D4FF' }}>30%</strong> от каждого пополнения
          </p>

          {/* Referral link */}
          <div style={{
            background: 'rgba(0,0,0,0.25)', borderRadius: '14px',
            padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '8px', border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{
              fontSize: '11px', opacity: 0.7, wordBreak: 'break-all',
              fontFamily: 'monospace', flex: 1,
            }}>{referralLink}</span>
            <button
              onClick={copyLink}
              style={{
                padding: '8px 16px', borderRadius: '10px',
                background: copied ? 'rgba(0,230,118,0.2)' : 'rgba(0,212,255,0.15)',
                border: copied ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(0,212,255,0.2)',
                color: copied ? '#00E676' : '#00D4FF',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.3s', whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓ Скопировано' : '📋 Копировать'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div className="glass anim-up stagger-2" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#00D4FF', marginBottom: '4px' }}>
              {loading ? '—' : stats?.total_referrals || 0}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.5 }}>Всего</div>
          </div>
          <div className="glass anim-up stagger-3" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#00E676', marginBottom: '4px' }}>
              {loading ? '—' : stats?.active_referrals || 0}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.5 }}>Активных</div>
          </div>
          <div className="glass anim-up stagger-4" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFD93D', marginBottom: '4px' }}>
              {loading ? '—' : `${stats?.total_earned || 0} ₽`}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.5 }}>Заработано</div>
          </div>
        </div>

        {/* Share button */}
        <button onClick={shareLink} className="btn-primary anim-up stagger-5">
          <span className="shimmer"></span>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
            Поделиться ссылкой
          </span>
        </button>
      </div>
    </div>
  );
}
