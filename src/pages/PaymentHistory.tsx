import { useApi } from '../hooks/useApi';
import { getPaymentHistory } from '../api/client';
import type { Payment } from '../types';

interface PaymentHistoryProps {
  onBack: () => void;
  userId: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  completed: {
    label: 'Оплачен',
    color: '#00E676',
    bg: 'rgba(0, 230, 118, 0.12)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#00E676" strokeWidth="1.5" fill="rgba(0,230,118,0.15)" />
        <path d="M8 12l3 3 5-6" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  pending: {
    label: 'Ожидает',
    color: '#FFD93D',
    bg: 'rgba(255, 217, 61, 0.12)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#FFD93D" strokeWidth="1.5" fill="rgba(255,217,61,0.15)" />
        <path d="M12 6v6l4 2" stroke="#FFD93D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  failed: {
    label: 'Ошибка',
    color: '#FF6B6B',
    bg: 'rgba(255, 107, 107, 0.12)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#FF6B6B" strokeWidth="1.5" fill="rgba(255,107,107,0.15)" />
        <path d="M15 9l-6 6M9 9l6 6" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  refunded: {
    label: 'Возврат',
    color: '#8B95A7',
    bg: 'rgba(139, 149, 167, 0.12)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="#8B95A7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 3v5h5" stroke="#8B95A7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="14" rx="2" stroke="#00D4FF" strokeWidth="1.5" fill="rgba(0,212,255,0.1)" />
    <path d="M2 10h20" stroke="#00D4FF" strokeWidth="1.5" />
    <circle cx="17" cy="14" r="1.5" fill="#00D4FF" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="#6E7A8A" strokeWidth="1" fill="none" strokeDasharray="4 2" />
    <path d="M2 10h20" stroke="#6E7A8A" strokeWidth="1" strokeDasharray="4 2" />
  </svg>
);

export function PaymentHistory({ onBack, userId }: PaymentHistoryProps) {
  const { data: payments, loading, error } = useApi<Payment[]>(
    () => getPaymentHistory(userId),
    [userId]
  );

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Платежи</h1>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div className="anim-pulse" style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass anim-up" style={{ padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>❌</div>
            <p style={{ fontSize: '14px', opacity: 0.6 }}>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && payments && payments.length === 0 && (
          <div className="glass anim-up" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px', animation: 'iconFloat 3s ease-in-out infinite' }}>
              <EmptyIcon />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Нет платежей</p>
            <p style={{ fontSize: '13px', opacity: 0.5 }}>Ваши платежи появятся здесь</p>
          </div>
        )}

        {/* Payments list */}
        {!loading && !error && payments && payments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {payments.map((payment, i) => {
              const status = statusConfig[payment.status] || statusConfig.pending;
              return (
                <div
                  key={payment.id}
                  className="glass anim-up"
                  style={{
                    padding: '16px 20px',
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{payment.description}</p>
                      <p style={{ fontSize: '11px', opacity: 0.4, margin: '4px 0 0' }}>
                        {new Date(payment.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 10px', borderRadius: '8px',
                      background: status.bg,
                    }}>
                      {status.icon}
                      <span style={{ fontSize: '11px', fontWeight: 600, color: status.color }}>{status.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#00D4FF' }}>
                      {payment.amount} ₽
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
