import { useState } from 'react';
import { hapticFeedback } from '../utils/haptic';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: '🔐',
    svgIcon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#00D4FF" strokeWidth="1.5" fill="rgba(0,212,255,0.1)" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#00D4FF" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="16" r="1.5" fill="#00D4FF" />
      </svg>
    ),
    title: 'Безопасный VPN',
    desc: 'Защитите своё соединение и обходите блокировки',
  },
  {
    icon: '⚡',
    svgIcon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#FFD93D" strokeWidth="1.5" fill="rgba(255,217,61,0.15)" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Быстрая скорость',
    desc: 'Серверы по всему миру для максимальной скорости',
  },
  {
    icon: '📱',
    svgIcon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke="#00E676" strokeWidth="1.5" fill="rgba(0,230,118,0.1)" />
        <circle cx="12" cy="19" r="1.5" stroke="#00E676" strokeWidth="1" />
        <path d="M9 6h6" stroke="#00E676" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    title: 'Все устройства',
    desc: 'Подключите до 10 устройств одновременно',
  },
  {
    icon: '🎁',
    svgIcon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="8" width="18" height="4" rx="1.5" stroke="#8B95A7" strokeWidth="1.5" fill="rgba(139,149,167,0.1)" />
        <rect x="5" y="12" width="14" height="9" rx="1.5" stroke="#8B95A7" strokeWidth="1.5" fill="rgba(139,149,167,0.1)" />
        <path d="M12 8V21" stroke="#8B95A7" strokeWidth="1.5" />
      </svg>
    ),
    title: 'Бонусы друзьям',
    desc: 'Приглашайте друзей и получайте 30% от оплат',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  const next = () => {
    hapticFeedback('light');
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      hapticFeedback('success');
      onComplete();
    }
  };

  const skip = () => {
    hapticFeedback('light');
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#050810', padding: '40px 24px',
    }}>
      {/* Skip button */}
      <button
        onClick={skip}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          padding: '8px 16px', borderRadius: '20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#6E7A8A', fontSize: '13px', cursor: 'pointer',
        }}
      >Пропустить</button>

      {/* Icon */}
      <div style={{
        width: '96px', height: '96px', borderRadius: '28px',
        background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,128,255,0.08))',
        border: '1px solid rgba(0,212,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '32px',
        animation: 'iconFloat 3s ease-in-out infinite',
      }}>
        {current.svgIcon}
      </div>

      {/* Title */}
      <h2 style={{
        fontSize: '24px', fontWeight: 800, marginBottom: '8px', textAlign: 'center',
      }}>{current.title}</h2>

      {/* Description */}
      <p style={{
        fontSize: '14px', opacity: 0.5, textAlign: 'center',
        maxWidth: '280px', lineHeight: 1.6, marginBottom: '40px',
      }}>{current.desc}</p>

      {/* Dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? '24px' : '8px',
            height: '8px', borderRadius: '4px',
            background: i === step ? '#00D4FF' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={next}
        className="btn-primary"
        style={{ width: '100%', maxWidth: '300px' }}
      >
        {step === steps.length - 1 ? 'Начать' : 'Далее'}
      </button>
    </div>
  );
}
