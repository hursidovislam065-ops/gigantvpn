import { useState, useEffect, useRef } from 'react';
import type { PageId } from '../types';
import { hapticFeedback } from '../utils/haptic';

interface NavItem {
  id: PageId;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const icons: Record<string, (a: boolean) => React.ReactNode> = {
  home: (a) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5L12 4L20 11.5V20C20 20.55 19.55 21 19 21H15V15H9V21H5C4.45 21 4 20.55 4 20V11.5Z"
        stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        fill={a ? 'rgba(0,212,255,0.12)' : 'none'} />
    </svg>
  ),
  referral: (a) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="4" rx="1.5"
        stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8"
        fill={a ? 'rgba(0,212,255,0.12)' : 'none'} />
      <rect x="5" y="12" width="14" height="9" rx="1.5"
        stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8"
        fill={a ? 'rgba(0,212,255,0.12)' : 'none'} />
      <path d="M12 8V21M12 8C12 8 12 5.5 9.5 4.5C8 4 7 5 7 6C7 7 8 8 12 8Z"
        stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8C12 8 12 5.5 14.5 4.5C16 4 17 5 17 6C17 7 16 8 12 8Z"
        stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  support: (a) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 18V12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12V18"
        stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="1" y="14" width="4" height="7" rx="2"
        stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8"
        fill={a ? 'rgba(0,212,255,0.12)' : 'none'} />
      <rect x="19" y="14" width="4" height="7" rx="2"
        stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8"
        fill={a ? 'rgba(0,212,255,0.12)' : 'none'} />
    </svg>
  ),
  settings: (a) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8"
        fill={a ? 'rgba(0,212,255,0.12)' : 'none'} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke={a ? '#00D4FF' : '#8B95A7'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        fill={a ? 'rgba(0,212,255,0.12)' : 'none'} />
    </svg>
  ),
};

const items: NavItem[] = [
  { id: 'home', label: 'Главная', icon: icons.home },
  { id: 'referral', label: 'Рефералы', icon: icons.referral },
  { id: 'support', label: 'Поддержка', icon: icons.support },
  { id: 'settings', label: 'Настройки', icon: icons.settings },
];

export function BottomNav({ current, onChange, badge }: { current: PageId; onChange: (id: PageId) => void; badge?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const idx = items.findIndex(i => i.id === current);
    const el = itemRefs.current[idx];
    const container = containerRef.current;
    if (el && container) {
      const cr = container.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      setPill({
        left: er.left - cr.left + (er.width - 48) / 2,
        width: 48,
      });
    }
    if (!ready) requestAnimationFrame(() => setTimeout(() => setReady(true), 100));
  }, [current, ready]);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      background: 'linear-gradient(to top, rgba(5,8,16,0.98) 0%, rgba(5,8,16,0.85) 50%, transparent 100%)',
    }}>
      <div style={{
        maxWidth: '420px', margin: '0 auto', padding: '0 20px',
      }}>
        {/* Glass bar */}
        <div ref={containerRef} style={{
          position: 'relative',
          background: 'rgba(15, 20, 32, 0.9)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '22px',
          border: '0.5px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3), inset 0 0.5px 0 rgba(255,255,255,0.06)',
          padding: '10px 0 6px',
        }}>
          {/* Active pill */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: `${pill.left}px`,
            width: `${pill.width}px`,
            height: '36px',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,128,255,0.08))',
            borderRadius: '12px',
            border: '0.5px solid rgba(0,212,255,0.2)',
            transition: ready ? 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
            pointerEvents: 'none',
          }} />

          {/* Items */}
          <div style={{ display: 'flex', justifyContent: 'space-around', position: 'relative' }}>
            {items.map((item, i) => {
              const isActive = current === item.id;
              const showBadge = item.id === 'support' && badge && badge > 0;
              return (
                <button
                  key={item.id}
                  ref={el => { itemRefs.current[i] = el; }}
                  onClick={() => { hapticFeedback('light'); onChange(item.id); }}
                  style={{
                    background: 'none', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    cursor: 'pointer', padding: '4px 16px',
                    transition: 'all 0.3s ease',
                    WebkitTapHighlightColor: 'transparent',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    transition: 'transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    position: 'relative',
                  }}>
                    {item.icon(isActive)}
                    {showBadge && (
                      <div style={{
                        position: 'absolute', top: '-4px', right: '-8px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: '#FF6B6B', color: 'white',
                        fontSize: '9px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'iconPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}>{badge > 9 ? '9+' : badge}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#00D4FF' : '#6E7A8A',
                    letterSpacing: '0.2px',
                    transition: 'color 0.3s ease',
                    lineHeight: 1,
                  }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
