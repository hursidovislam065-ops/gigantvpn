import { useToast } from '../hooks/useToast';
import type { Toast } from '../types';

const icons: Record<Toast['type'], string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const colors: Record<Toast['type'], string> = {
  success: 'rgba(0, 230, 118, 0.15)',
  error: 'rgba(255, 107, 107, 0.15)',
  info: 'rgba(0, 212, 255, 0.15)',
  warning: 'rgba(255, 217, 61, 0.15)',
};

const borders: Record<Toast['type'], string> = {
  success: 'rgba(0, 230, 118, 0.3)',
  error: 'rgba(255, 107, 107, 0.3)',
  info: 'rgba(0, 212, 255, 0.3)',
  warning: 'rgba(255, 217, 61, 0.3)',
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
          }}
        >
          <span style={{ fontSize: '18px', flexShrink: 0 }}>{icons[toast.type]}</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: textColors[toast.type], lineHeight: 1.4 }}>
            {toast.message}
          </span>
        </div>
      ))}
    </div>
  );
}
