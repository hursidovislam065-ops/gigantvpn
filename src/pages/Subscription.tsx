import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../hooks/useToast';
import { getPlans, createPayment, confirmPayment } from '../api/client';
import type { Plan } from '../types';

interface SubscriptionProps {
  onBack: () => void;
  userId: number;
  onPaymentSuccess: () => void;
}

const fallbackPlans: Plan[] = [
  { id: 1, name: '7 дней', price: 79, days: 7, per_day: '11.3' },
  { id: 2, name: '1 месяц', price: 199, days: 30, per_day: '6.6' },
  { id: 3, name: '3 месяца', price: 539, days: 90, badge: '−10%', per_day: '6.0' },
  { id: 4, name: '6 месяцев', price: 999, days: 180, badge: '−16%', per_day: '5.6' },
  { id: 5, name: '12 месяцев', price: 1799, days: 365, badge: '−25%', per_day: '4.9' },
];

const ALLOWED_PAYMENT_DOMAINS = ['yookassa.ru', 'stripe.com', 'example.com'];

function isValidPaymentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PAYMENT_DOMAINS.some(d => parsed.hostname.endsWith(d));
  } catch {
    return false;
  }
}

export function Subscription({ onBack, userId, onPaymentSuccess }: SubscriptionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [devices, setDevices] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    getPlans()
      .then(data => {
        setPlans(data);
        if (data.length > 0) setSelectedPlan(data[0]);
      })
      .catch(() => {
        setPlans(fallbackPlans);
        setSelectedPlan(fallbackPlans[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPrice = useMemo(() => {
    if (!selectedPlan) return 0;
    const extraDevices = Math.max(0, devices - 3);
    const extraTotal = extraDevices * 50 * (selectedPlan.days / 30);
    return selectedPlan.price + extraTotal;
  }, [selectedPlan, devices]);

  const handlePayment = async () => {
    if (!selectedPlan || !userId) {
      addToast('error', 'Выберите тариф');
      return;
    }

    setIsProcessing(true);
    try {
      const payment = await createPayment({
        user_id: userId,
        amount: totalPrice,
        description: `Подписка ${selectedPlan.name}`,
      });

      if (payment.payment_url) {
        if (!isValidPaymentUrl(payment.payment_url)) {
          addToast('error', 'Небезопасная ссылка оплаты');
          return;
        }
        window.location.href = payment.payment_url;
        return;
      }

      const result = await confirmPayment(payment.payment_id);
      if (result.success) {
        addToast('success', 'Оплата прошла! Подписка активирована.');
        onPaymentSuccess();
        onBack();
      } else {
        addToast('error', 'Ошибка подтверждения платежа');
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Ошибка оплаты');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '60px' }}>
          <div className="anim-pulse" style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '14px', opacity: 0.5 }}>Загрузка тарифов...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p style={{ fontSize: '14px', opacity: 0.5 }}>Тарифы временно недоступны</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <button onClick={onBack} className="btn-back" style={{ marginBottom: '20px' }}>←</button>

        <h1 style={{
          fontSize: '24px', fontWeight: 800, marginBottom: '4px',
          background: 'linear-gradient(135deg, #fff, #00D4FF)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Выберите тариф
        </h1>
        <p style={{ fontSize: '13px', opacity: 0.5, marginBottom: '20px' }}>
          Доступ ко всему миру и высокий уровень защиты
        </p>

        {/* Plan Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          {plans.map(plan => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={isSelected ? 'glass-pro' : 'glass'}
                style={{
                  padding: '14px 8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  color: 'white',
                  position: 'relative',
                  transition: 'all 0.3s',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#00D4FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '8px', color: 'black', fontWeight: 700,
                  }}>✓</div>
                )}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '4px', right: isSelected ? '22px' : '4px',
                    background: 'rgba(0,230,118,0.15)',
                    border: '1px solid rgba(0,230,118,0.3)',
                    color: '#00E676', fontSize: '8px', fontWeight: 700,
                    padding: '2px 6px', borderRadius: '4px',
                  }}>{plan.badge}</div>
                )}
                <p style={{ fontSize: '11px', fontWeight: 600, margin: '0 0 4px' }}>{plan.name}</p>
                <p style={{
                  fontSize: '18px', fontWeight: 800, margin: 0,
                  color: isSelected ? '#00D4FF' : 'white',
                }}>{plan.price} ₽</p>
                <p style={{ fontSize: '9px', opacity: 0.4, margin: '4px 0 0' }}>{plan.per_day} ₽/день</p>
              </button>
            );
          })}
        </div>

        {/* Devices Selector */}
        <div className="glass" style={{ padding: '16px 20px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 6px' }}>Устройства</p>
          <p style={{ fontSize: '11px', opacity: 0.5, margin: '0 0 12px' }}>
            Включено 3 устройства, доп. +50 ₽/мес
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setDevices(Math.max(1, devices - 1))}
              style={{
                width: '36px', height: '36px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white', fontSize: '18px', cursor: 'pointer',
              }}
            >−</button>
            <span style={{
              fontSize: '24px', fontWeight: 700, minWidth: '40px',
              textAlign: 'center', color: '#00D4FF',
            }}>{devices}</span>
            <button
              onClick={() => setDevices(devices + 1)}
              style={{
                width: '36px', height: '36px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
                border: 'none', color: 'black', fontSize: '18px', fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,212,255,0.3)',
              }}
            >+</button>
          </div>
        </div>

        {/* Total */}
        <div className="glass-pro" style={{ padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Итого:</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#00D4FF' }}>
              {totalPrice} ₽
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.5 }}>
            <span>{selectedPlan.name}</span>
            <span>{devices} устройства</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          className="btn-primary"
          disabled={isProcessing}
          style={{ opacity: isProcessing ? 0.6 : 1 }}
        >
          {isProcessing ? '⏳ Обработка...' : `💳 Оплатить ${totalPrice} ₽`}
        </button>
      </div>
    </div>
  );
}
