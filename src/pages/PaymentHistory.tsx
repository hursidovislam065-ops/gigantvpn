import { useApi } from '../hooks/useApi';
import { getPaymentHistory } from '../api/client';
import type { Payment } from '../types';

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: 'Оплачен', color: '#00E676', bg: 'rgba(0, 230, 118, 0.15)' },
  pending: { label: 'Ожидает', color: '#FFD93D', bg: 'rgba(255, 217, 61, 0.15)' },
  failed: { label: 'Ошибка', color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.15)' },
  refunded: { label: 'Возврат', color: '#8B95A7', bg: 'rgba(139, 149, 167, 0.15)' },
};

export function PaymentHistory({ onBack, userId }: { onBack: () => void; userId: number }) {
  const { data: payments, loading, error } = useApi<Payment[]>(
    () => getPaymentHistory(userId),
    [userId]
  );

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>💳 История платежей</h1>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div className="anim-pulse" style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <p style={{ fontSize: '14px', opacity: 0.5 }}>{error}</p>
          </div>
        )}

        {!loading && !error && payments && payments.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '14px', opacity: 0.5 }}>Нет платежей</p>
          </div>
        )}

        {payments && payments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {payments.map(payment => {
              const status = statusMap[payment.status] || statusMap.pending;
              return (
                <div key={payment.id} className="glass anim-up" style={{ padding: '16px 20px' }}>
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
                    <span style={{
                      padding: '4px 10px', borderRadius: '8px',
                      background: status.bg, color: status.color,
                      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
