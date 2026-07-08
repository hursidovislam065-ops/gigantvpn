import { useState } from 'react';
import { hapticFeedback } from '../utils/haptic';

const DocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#00D4FF" strokeWidth="1.5" fill="rgba(0,212,255,0.1)" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#00E676" strokeWidth="1.5" fill="rgba(0,230,118,0.1)" />
    <path d="M9 12l2 2 4-4" stroke="#00E676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const tabs = [
  { id: 'agreement', label: 'Соглашение', icon: <DocIcon /> },
  { id: 'privacy', label: 'Политика', icon: <ShieldIcon /> },
] as const;

const content = {
  agreement: {
    title: 'Пользовательское соглашение',
    sections: [
      { title: '1. Общие положения', text: 'Настоящее Пользовательское соглашение регулирует отношения между владельцем Telegram-бота GigantVPN и физическим лицом, использующим функционал сервиса.' },
      { title: '2. Предмет соглашения', text: 'Сервис предоставляет услуги VPN-доступа в сеть Интернет на возмездной основе. Пользователь получает защищенное соединение и возможность обхода блокировок через Telegram-бот при наличии подписки.' },
      { title: '3. Регистрация и использование', text: 'Для использования сервиса необходимо авторизоваться в Telegram-боте. Идентификация осуществляется по Telegram ID. Новый пользователь получает бесплатный пробный период 3 дня.' },
      { title: '4. Подписка и оплата', text: 'Оплата производится через платёжную систему. Подписка продлевается автоматически при включённом автопродлении. Стоимость и сроки отображаются в интерфейсе сервиса.' },
      { title: '5. Возврат средств', text: 'При неудовлетворённости качеством услуг можно потребовать возврата неиспользованных средств в течение 10 рабочих дней после обращения в поддержку.' },
      { title: '6. Ограничения', text: 'Пользователю запрещается использовать сервис для: рассылки спама, DDoS-атак, фишинга, распространения вредоносного ПО, действий, нарушающих законодательство РФ.' },
      { title: '7. Ответственность', text: 'Сервис предоставляется "как есть". Исполнитель не несёт ответственности за сбои сети Интернет и блокировки третьих сторон.' },
    ],
  },
  privacy: {
    title: 'Политика конфиденциальности',
    sections: [
      { title: '1. Общие положения', text: 'Настоящая Политика определяет порядок обработки и защиты персональных данных пользователей Telegram-бота GigantVPN в соответствии с ФЗ РФ № 152-ФЗ «О персональных данных».' },
      { title: '2. Сбор данных', text: 'Сервис осуществляет минимальный сбор данных. Обрабатывается исключительно Telegram ID пользователя. Сервис не ведёт журналы активности, не собирает IP-адреса и историю подключений.' },
      { title: '3. Цели обработки', text: 'Персональные данные используются для: идентификации пользователя, предоставления VPN-услуг, обработки связи и поддержки, исполнения договорных обязательств.' },
      { title: '4. Хранение и защита', text: 'Telegram ID хранится в защищённой базе данных с ограниченным доступом. При прекращении использования данные удаляются в течение 30 календарных дней.' },
      { title: '5. Передача третьим лицам', text: 'Данные не передаются третьим лицам, за исключением случаев, предусмотренных законодательством РФ.' },
      { title: '6. Права пользователя', text: 'Пользователь имеет право: получать информацию об обработке данных, требовать уточнения или удаления, отзывать согласие на обработку.' },
    ],
  },
};

export function Documents({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'agreement' | 'privacy'>('agreement');
  const current = content[activeTab];

  const handleTab = (tab: 'agreement' | 'privacy') => {
    hapticFeedback('light');
    setActiveTab(tab);
  };

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Документы</h1>
        </div>

        {/* Tabs */}
        <div className="glass" style={{ padding: '6px', marginBottom: '16px', display: 'flex', gap: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '14px',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                color: activeTab === tab.id ? '#00D4FF' : '#6E7A8A',
                background: activeTab === tab.id ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass anim-up" style={{ padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'agreement' ? <DocIcon /> : <ShieldIcon />}
            {current.title}
          </h2>
          {current.sections.map((section, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#00D4FF', margin: '0 0 6px' }}>{section.title}</h3>
              <p style={{ fontSize: '13px', opacity: 0.7, lineHeight: 1.6, margin: 0 }}>{section.text}</p>
              {i < current.sections.length - 1 && (
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', marginTop: '12px' }} />
              )}
            </div>
          ))}
        </div>

        <div className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Поддержка</p>
            <p style={{ fontSize: '12px', opacity: 0.5, margin: 0 }}>
              <a href="https://t.me/gigantvpn_bot" target="_blank" rel="noopener noreferrer" style={{ color: '#00D4FF' }}>@gigantvpn_bot</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
