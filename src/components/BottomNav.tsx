import type { PageId } from '../types';

interface NavItem {
  id: PageId;
  icon: string;
  label: string;
}

const items: NavItem[] = [
  { id: 'home', icon: '🏠', label: 'Главная' },
  { id: 'referral', icon: '🎁', label: 'Рефералы' },
  { id: 'support', icon: '🎧', label: 'Поддержка' },
  { id: 'settings', icon: '⚙️', label: 'Настройки' },
];

export function BottomNav({ current, onChange }: { current: PageId; onChange: (id: PageId) => void }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'rgba(10, 14, 26, 0.85)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0',
      }}>
        {items.map(item => {
          const isActive = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer',
                color: isActive ? '#00D4FF' : '#6E7A8A',
                padding: '4px 16px',
                position: 'relative',
                minWidth: '56px',
                transition: 'color 0.3s',
              }}
            >
              <span style={{
                fontSize: '22px',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isActive ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
              }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.3px' }}>
                {item.label}
              </span>
              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  width: '20px',
                  height: '3px',
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #00D4FF, #0080FF)',
                  boxShadow: '0 0 12px rgba(0,212,255,0.5)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
