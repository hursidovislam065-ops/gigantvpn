import { useState } from 'react';

const tabs = [
  { id: 'agreement', label: '📄 Соглашение' },
  { id: 'privacy', label: '🔒 Политика' },
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
      { title: '8. Поддержка', text: 'По вопросам: @gigantvpn_bot' },
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
      { title: '7. Контакты', text: 'По вопросам обработки данных: @gigantvpn_bot' },
    ],
  },
};

export function Documents({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'agreement' | 'privacy'>('agreement');
  const current = content[activeTab];

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={onBack} className="btn-back">←</button>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📋 Документы</h1>
        </div>

        {/* Tabs */}
        <div className="glass" style={{ padding: '6px', marginBottom: '16px', display: 'flex', gap: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '14px',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                color: activeTab === tab.id ? '#00D4FF' : '#6E7A8A',
                background: activeTab === tab.id ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
                transition: 'all 0.3s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass anim-up" style={{ padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>{current.title}</h2>
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

        <div className="glass" style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 4px' }}>📱 Поддержка</p>
          <p style={{ fontSize: '12px', opacity: 0.5, margin: 0 }}>
            По всем вопросам: <a href="https://t.me/gigantvpn_bot" target="_blank" rel="noopener noreferrer" style={{ color: '#00D4FF' }}>@gigantvpn_bot</a>
          </p>
        </div>
      </div>
    </div>
  );
}
