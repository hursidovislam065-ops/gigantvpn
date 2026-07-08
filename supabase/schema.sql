-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  email TEXT,
  subscription_until TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT FALSE,
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  referred_by BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration_days INT NOT NULL,
  price NUMERIC NOT NULL,
  price_stars INT
);

-- Insert default plans
INSERT INTO plans (id, name, duration_days, price, price_stars) VALUES
  ('7days', '7 дней', 7, 79, 75),
  ('1month', '1 месяц', 30, 199, 190),
  ('3month', '3 месяца', 90, 499, 475),
  ('6month', '6 месяцев', 180, 899, 850),
  ('12month', '12 месяцев', 365, 1599, 1500)
ON CONFLICT (id) DO NOTHING;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  amount NUMERIC NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  payment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  name TEXT NOT NULL,
  platform TEXT DEFAULT 'unknown',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Policies: allow all for anon (simplified, add proper auth later)
CREATE POLICY "Allow all users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all plans" ON plans FOR ALL USING (true);
CREATE POLICY "Allow all payments" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all devices" ON devices FOR ALL USING (true);
