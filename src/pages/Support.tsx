import { useState } from 'react';
import { hapticFeedback } from '../utils/haptic';

interface FAQItem {
  id: number;
  title: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  { id: 1, title: 'VPN не подключается', answer: 'Проверьте подключение к интернету и попробуйте сменить локацию. Если проблема сохраняется — перезапустите приложение.' },
  { id: 2, title: 'Как установить VPN?', answer: 'Откройте раздел "Настройка VPN", скачайте приложение Happ и импортируйте ключ доступа, скопировав ссылку подписки.' },
  { id: 3, title: 'Интернет стал медленнее', answer: 'Скорость может зависеть от выбранной локации. Попробуйте подключиться к ближайшему серверу или сменить регион.' },
  { id: 4, title: 'Нашли баг или ошибку', answer: 'Опишите проблему в чате поддержки — мы постараемся помочь как можно быстрее. Приложите скриншот, если возможно.' },
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

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface SupportProps {
  onBack: () => void;
}

export function Support({ onBack }: SupportProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => {
    hapticFeedback('light');
    setOpenId(openId === id ? null : id);
  };

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header */}
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
            Напишите в чат, если возникли проблемы
          </p>
          <a
            href="https://t.me/gigantvpn_bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              color: '#000', fontWeight: 700, fontSize: '15px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
            }}
          >
            <ChatIcon /> Написать в чат
          </a>
        </div>
      </div>
    </div>
  );
}
