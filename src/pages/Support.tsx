import { useState } from 'react';
import { hapticFeedback } from '../utils/haptic';
import { createSupportTicket, sendSupportMessage } from '../api/client';

interface FAQItem {
  id: number;
  title: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  { id: 1, title: 'VPN не подключается', answer: 'Проверьте подключение к интернету и попробуйте сменить локацию. Если проблема сохраняется — перезапустите приложение.' },
  { id: 2, title: 'Как установить VPN?', answer: 'Откройте раздел "Настройка VPN", скачайте приложение Happ и импортируйте ключ доступа, скопировав ссылку подписки.' },
  { id: 3, title: 'Интернет стал медленнее', answer: 'Скорость может зависеть от выбранной локации. Попробуйте подключиться к ближайшему серверу или сменить регион.' },
  { id: 4, title: 'Нашли баг или ошибку', answer: 'Опишите проблему в обращении — мы постараемся помочь как можно быстрее. Приложите скриншот, если возможно.' },
  { id: 5, title: 'Как отменить подписку?', answer: 'Перейдите в Настройки → Подписка и отключите автопродление. Подписка останется активной до конца оплаченного периода.' },
  { id: 6, title: 'Сколько устройств можно подключить?', answer: 'По умолчанию доступно 3 устройства. Дополнительные устройства можно добавить в разделе "Устройства".' },
];

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const HeadphonesIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M3 18V12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12V18" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="1" y="14" width="4" height="7" rx="2" stroke="#00D4FF" strokeWidth="1.5" fill="rgba(0,212,255,0.15)" />
    <rect x="19" y="14" width="4" height="7" rx="2" stroke="#00D4FF" strokeWidth="1.5" fill="rgba(0,212,255,0.15)" />
  </svg>
);

const CheckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

interface SupportProps {
  onBack: () => void;
  userId: number;
}

export function Support({ onBack, userId }: SupportProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const toggle = (id: number) => {
    hapticFeedback('light');
    setOpenId(openId === id ? null : id);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    try {
      const ticket = await createSupportTicket(userId, subject.trim());
      await sendSupportMessage(ticket.id, message.trim(), userId, 'user');
      setSent(true);
      hapticFeedback('medium');
    } catch (e) {
      console.error('Failed to send:', e);
      alert('Ошибка отправки. Попробуйте ещё раз.');
    }
    setLoading(false);
  };

  const handleNew = () => {
    setSubject('');
    setMessage('');
    setSent(false);
    setShowForm(true);
  };

  // Sent confirmation
  if (sent) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button onClick={onBack} className="btn-back">←</button>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Поддержка</h1>
          </div>
          <div className="glass-pro anim-up" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,128,255,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckIcon />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Отправлено!</h3>
            <p style={{ fontSize: '13px', opacity: 0.5, margin: '0 0 24px', lineHeight: 1.5 }}>
              Мы ответим вам в ближайшее время
            </p>
            <button
              onClick={handleNew}
              style={{
                padding: '12px 24px', borderRadius: '12px', border: 'none',
                background: 'rgba(255,255,255,0.06)', color: '#999',
                fontSize: '13px', cursor: 'pointer', marginRight: '8px',
              }}
            >
              Новое обращение
            </button>
            <button
              onClick={onBack}
              style={{
                padding: '12px 24px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
                color: '#000', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form view
  if (showForm) {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => setShowForm(false)} className="btn-back">←</button>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Обращение</h1>
          </div>

          <div className="glass anim-up" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Опишите вашу проблему, и мы ответим
            </div>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Тема"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white', fontSize: '14px', outline: 'none',
                marginBottom: '12px', boxSizing: 'border-box',
              }}
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Опишите проблему..."
              rows={5}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white', fontSize: '14px', outline: 'none',
                resize: 'vertical', fontFamily: 'inherit',
                marginBottom: '16px', boxSizing: 'border-box',
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={!subject.trim() || !message.trim() || loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: (subject.trim() && message.trim())
                  ? 'linear-gradient(135deg, #00D4FF, #0080FF)'
                  : 'rgba(255,255,255,0.06)',
                color: (subject.trim() && message.trim()) ? '#000' : '#666',
                fontWeight: 700, fontSize: '14px',
                cursor: (subject.trim() && message.trim()) ? 'pointer' : 'default',
              }}
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FAQ view (default)
  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Поддержка</h1>
        </div>

        {/* FAQ Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {faqItems.map((item, i) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="glass anim-up"
                style={{
                  overflow: 'hidden',
                  animationDelay: `${i * 0.05}s`,
                  borderColor: isOpen ? 'rgba(0,212,255,0.2)' : undefined,
                }}
              >
                <button
                  onClick={() => toggle(item.id)}
                  style={{
                    width: '100%', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', color: 'white',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.title}</span>
                  <ChevronIcon open={isOpen} />
                </button>
                <div style={{
                  maxHeight: isOpen ? '200px' : '0',
                  opacity: isOpen ? 1 : 0,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                }}>
                  <p style={{
                    padding: '0 20px 16px',
                    fontSize: '13px', opacity: 0.6, lineHeight: 1.6, margin: 0,
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    paddingTop: '12px',
                  }}>
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact card */}
        <div className="glass-pro anim-up" style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', margin: '0 auto 12px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,128,255,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'iconFloat 3s ease-in-out infinite',
          }}>
            <HeadphonesIcon />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>Нужна помощь?</h3>
          <p style={{ fontSize: '13px', opacity: 0.5, margin: '0 0 16px', lineHeight: 1.5 }}>
            Напишите нам, и мы ответим
          </p>
          <button
            onClick={() => { handleNew(); hapticFeedback('medium'); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              color: '#000', fontWeight: 700, fontSize: '15px',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
            }}
          >
            Написать обращение
          </button>
        </div>
      </div>
    </div>
  );
}
