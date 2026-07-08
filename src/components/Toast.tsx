import { useToast } from '../hooks/useToast';
import type { Toast } from '../types';

const ToastIcon = ({ type }: { type: Toast['type'] }) => {
  const icons: Record<string, React.ReactNode> = {
    success: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#00E676" strokeWidth="1.5" fill="rgba(0,230,118,0.15)" />
        <path d="M8 12l3 3 5-6" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    error: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#FF6B6B" strokeWidth="1.5" fill="rgba(255,107,107,0.15)" />
        <path d="M15 9l-6 6M9 9l6 6" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    info: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#00D4FF" strokeWidth="1.5" fill="rgba(0,212,255,0.15)" />
        <path d="M12 16v-4M12 8h.01" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    warning: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 20h20L12 2z" stroke="#FFD93D" strokeWidth="1.5" fill="rgba(255,217,61,0.15)" strokeLinejoin="round" />
        <path d="M12 9v4M12 16h.01" stroke="#FFD93D" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };
  return <>{icons[type]}</>;
};

const colors: Record<Toast['type'], string> = {
  success: 'rgba(0, 230, 118, 0.12)',
  error: 'rgba(255, 107, 107, 0.12)',
  info: 'rgba(0, 212, 255, 0.12)',
  warning: 'rgba(255, 217, 61, 0.12)',
};

const borders: Record<Toast['type'], string> = {
  success: 'rgba(0, 230, 118, 0.25)',
  error: 'rgba(255, 107, 107, 0.25)',
  info: 'rgba(0, 212, 255, 0.25)',
  warning: 'rgba(255, 217, 61, 0.25)',
};

const textColors: Record<Toast['type'], string> = {
  success: '#00E676',
  error: '#FF6B6B',
  info: '#00D4FF',
  warning: '#FFD93D',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '380px',
        width: 'calc(100% - 32px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="alert"
          onClick={() => removeToast(toast.id)}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '14px',
            background: colors[toast.type],
            border: `1px solid ${borders[toast.type]}`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            cursor: 'pointer',
            animation: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ flexShrink: 0, animation: 'iconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <ToastIcon type={toast.type} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: textColors[toast.type], lineHeight: 1.4 }}>
            {toast.message}
          </span>
        </div>
      ))}
    </div>
  );
}
