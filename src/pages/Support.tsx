import { useState, useEffect, useRef } from 'react';
import { hapticFeedback } from '../utils/haptic';
import type { SupportTicket, SupportMessage } from '../types';
import { getSupportTickets, createSupportTicket, getSupportMessages, sendSupportMessage, closeSupportTicket, markMessagesRead } from '../api/client';

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

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface SupportProps {
  onBack: () => void;
  userId: number;
}

export function Support({ onBack, userId }: SupportProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [view, setView] = useState<'faq' | 'tickets' | 'chat'>('faq');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === 'tickets') loadTickets();
  }, [view]);

  useEffect(() => {
    if (activeTicket) {
      loadMessages(activeTicket.id);
      markMessagesRead(activeTicket.id).catch(() => {});
    }
  }, [activeTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getSupportTickets(userId);
      setTickets(data);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    }
    setLoading(false);
  };

  const loadMessages = async (ticketId: number) => {
    try {
      const data = await getSupportMessages(ticketId);
      setMessages(data);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim()) return;
    setLoading(true);
    try {
      const ticket = await createSupportTicket(userId, newSubject.trim());
      setTickets(prev => [ticket, ...prev]);
      setActiveTicket(ticket);
      setNewSubject('');
      setShowNewTicket(false);
      setView('chat');
    } catch (e) {
      console.error('Failed to create ticket:', e);
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeTicket) return;
    const msg = newMessage.trim();
    setNewMessage('');
    try {
      const sent = await sendSupportMessage(activeTicket.id, msg, userId, 'user');
      setMessages(prev => [...prev, sent]);
      setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, updated_at: new Date().toISOString() } : t));
    } catch (e) {
      console.error('Failed to send message:', e);
      setNewMessage(msg);
    }
  };

  const handleCloseTicket = async (ticketId: number) => {
    try {
      await closeSupportTicket(ticketId);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
      if (activeTicket?.id === ticketId) {
        setActiveTicket({ ...activeTicket, status: 'closed' });
      }
    } catch (e) {
      console.error('Failed to close ticket:', e);
    }
  };

  const toggle = (id: number) => {
    hapticFeedback('light');
    setOpenId(openId === id ? null : id);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'open': return { text: 'Открыто', color: '#00D4FF' };
      case 'in_progress': return { text: 'В работе', color: '#FFD700' };
      case 'closed': return { text: 'Закрыто', color: '#666' };
      default: return { text: status, color: '#666' };
    }
  };

  // Chat view
  if (view === 'chat' && activeTicket) {
    const status = statusLabel(activeTicket.status);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f' }}>
        {/* Chat header */}
        <div style={{
          padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(20px)',
        }}>
          <button onClick={() => { setView('tickets'); setActiveTicket(null); }} className="btn-back">←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeTicket.subject}
            </div>
            <div style={{ fontSize: '12px', color: status.color }}>{status.text}</div>
          </div>
          {activeTicket.status !== 'closed' && (
            <button
              onClick={() => handleCloseTicket(activeTicket.id)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: 'none',
                color: '#ff6b6b', padding: '8px 12px', borderRadius: '8px',
                fontSize: '12px', cursor: 'pointer',
              }}
            >
              Закрыть
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', padding: '40px 20px' }}>
              Напишите первое сообщение
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                className="glass"
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.sender === 'user'
                    ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,128,255,0.1))'
                    : 'rgba(255,255,255,0.04)',
                  borderColor: msg.sender === 'user' ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {msg.message}
                </div>
                <div style={{
                  fontSize: '11px', color: '#666', marginTop: '4px',
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                }}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeTicket.status !== 'closed' && (
          <div style={{
            padding: '12px 16px', display: 'flex', gap: '8px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(20px)',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Сообщение..."
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white', fontSize: '14px', outline: 'none',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              style={{
                width: '44px', height: '44px', borderRadius: '12px',
                border: 'none',
                background: newMessage.trim() ? 'linear-gradient(135deg, #00D4FF, #0080FF)' : 'rgba(255,255,255,0.06)',
                color: newMessage.trim() ? '#000' : '#666',
                cursor: newMessage.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SendIcon />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Tickets list view
  if (view === 'tickets') {
    return (
      <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => setView('faq')} className="btn-back">←</button>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, flex: 1 }}>Мои обращения</h1>
            <button
              onClick={() => setShowNewTicket(true)}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
                color: '#000', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <PlusIcon />
            </button>
          </div>

          {/* New ticket form */}
          {showNewTicket && (
            <div className="glass anim-up" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Новое обращение</div>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTicket()}
                placeholder="Тема обращения..."
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'white', fontSize: '14px', outline: 'none',
                  marginBottom: '12px', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setShowNewTicket(false); setNewSubject(''); }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: 'rgba(255,255,255,0.06)', color: '#999',
                    fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={!newSubject.trim() || loading}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: newSubject.trim() ? 'linear-gradient(135deg, #00D4FF, #0080FF)' : 'rgba(255,255,255,0.06)',
                    color: newSubject.trim() ? '#000' : '#666',
                    fontSize: '13px', fontWeight: 600, cursor: newSubject.trim() ? 'pointer' : 'default',
                  }}
                >
                  {loading ? '...' : 'Создать'}
                </button>
              </div>
            </div>
          )}

          {/* Tickets list */}
          {loading && tickets.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', padding: '40px' }}>
              Загрузка...
            </div>
          )}
          {!loading && tickets.length === 0 && !showNewTicket && (
            <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', padding: '40px 20px' }}>
              <div style={{ marginBottom: '8px' }}>Обращений пока нет</div>
              <div style={{ fontSize: '12px', opacity: 0.5 }}>Нажмите + чтобы создать</div>
            </div>
          )}
          {tickets.map((ticket, i) => {
            const st = statusLabel(ticket.status);
            return (
              <div
                key={ticket.id}
                className="glass anim-up"
                onClick={() => { setActiveTicket(ticket); setView('chat'); hapticFeedback('light'); }}
                style={{
                  padding: '14px 16px', marginBottom: '8px', cursor: 'pointer',
                  animationDelay: `${i * 0.05}s`,
                  borderColor: ticket.status !== 'closed' ? 'rgba(0,212,255,0.1)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.subject}
                  </div>
                  <div style={{ fontSize: '11px', color: st.color, marginLeft: '8px', flexShrink: 0 }}>{st.text}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatDate(ticket.updated_at)} · {formatTime(ticket.updated_at)}
                </div>
              </div>
            );
          })}
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
            Напишите нам, и мы ответим как можно быстрее
          </p>
          <button
            onClick={() => { setView('tickets'); hapticFeedback('medium'); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #00D4FF, #0080FF)',
              color: '#000', fontWeight: 700, fontSize: '15px',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
            }}
          >
            Написать в чат
          </button>
        </div>
      </div>
    </div>
  );
}
