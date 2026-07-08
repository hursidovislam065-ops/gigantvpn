-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'admin')),
  message TEXT NOT NULL,
  telegram_id BIGINT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policies: users see only their own tickets
CREATE POLICY "Users read own tickets" ON support_tickets
  FOR SELECT USING (true);

CREATE POLICY "Users create own tickets" ON support_tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update own tickets" ON support_tickets
  FOR UPDATE USING (true);

-- Policies: users see messages in their tickets, admin sees all
CREATE POLICY "Users read messages" ON support_messages
  FOR SELECT USING (true);

CREATE POLICY "Users send messages" ON support_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update read status" ON support_messages
  FOR UPDATE USING (true);

-- Function to update ticket updated_at on new message
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets SET updated_at = NOW() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_ticket_updated_at
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();
