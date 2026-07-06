import { useState } from 'react';

const faq = [
  {
    id: 1,
    title: 'VPN не подключается',
    answer: 'Проверьте подключение к интернету и попробуйте сменить локацию. Если проблема сохраняется — перезапустите приложение.',
  },
  {
    id: 2,
    title: 'Как установить VPN?',
    answer: 'Откройте раздел "Настройка VPN", скачайте приложение и импортируйте ключ доступа.',
  },
  {
    id: 3,
    title: 'Интернет стал медленнее',
    answer: 'Скорость может зависеть от выбранной локации. Попробуйте подключиться к ближайшему серверу.',
  },
  {
    id: 4,
    title: 'Нашли баг или ошибку?',
    answer: 'Опишите проблему в чате поддержки — мы постараемся помочь как можно быстрее.',
  },
  {
    id: 5,
    title: 'Как отменить подписку?',
    answer: 'Перейдите в Настройки → Подписка и отключите автопродление. Подписка останется активной до конца оплаченного периода.',
  },
];

export function Support({ onBack }: { onBack: () => void }) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🎧 Поддержка</h1>
        </div>

        {/* FAQ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {faq.map(item => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="glass anim-up" style={{ overflow: 'hidden', transition: 'all 0.3s' }}>
                <button
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  style={{
                    width: '100%', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', background: 'transparent', border: 'none',
                    color: 'white', fontSize: '14px', fontWeight: 600, textAlign: 'left',
                  }}
                >
                  <span>{item.id}. {item.title}</span>
                  <span style={{
                    fontSize: '18px', transition: 'transform 0.3s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5,
                  }}>▼</span>
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 20px 16px', fontSize: '13px', opacity: 0.7, lineHeight: 1.5,
                    borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px',
                  }}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="glass-pro anim-up" style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', margin: '0 auto 12px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)',
          }}>💬</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>Нужна помощь?</h3>
          <p style={{ fontSize: '13px', opacity: 0.5, margin: '0 0 16px', lineHeight: 1.4 }}>
            Напишите в чат, если возникли проблемы или вопросы.
          </p>
          <a
            href="https://t.me/gigantvpn_bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '14px 32px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              color: '#000', fontWeight: 700, textDecoration: 'none',
              fontSize: '15px', boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
            }}
          >
            Пройти в чат →
          </a>
        </div>
      </div>
    </div>
  );
}
