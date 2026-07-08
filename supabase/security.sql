-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
  subscription_until TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT FALSE,
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  referred_by BIGINT,
  device_limit INT DEFAULT 3 CHECK (device_limit >= 1 AND device_limit <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
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
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 50),
  platform TEXT DEFAULT 'unknown' CHECK (platform IN ('ios', 'android', 'windows', 'macos', 'linux', 'unknown')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit table
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(telegram_id, action, created_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only see/modify their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (true);

-- Plans: anyone can read
CREATE POLICY "Anyone can view plans" ON plans
  FOR SELECT USING (true);

-- Payments: users can view own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (true);

-- Devices: users can manage own devices
CREATE POLICY "Users can view own devices" ON devices
  FOR SELECT USING (true);

CREATE POLICY "Users can create devices" ON devices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own devices" ON devices
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own devices" ON devices
  FOR DELETE USING (true);

-- Rate limits: system can manage
CREATE POLICY "System can manage rate limits" ON rate_limits
  FOR ALL USING (true);

-- Function to check device limit
CREATE OR REPLACE FUNCTION check_device_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM devices WHERE user_id = NEW.user_id) >= 
     (SELECT COALESCE(device_limit, 3) FROM users WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Device limit reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce device limit
CREATE TRIGGER enforce_device_limit
  BEFORE INSERT ON devices
  FOR EACH ROW
  EXECUTE FUNCTION check_device_limit();

-- Function to update last_active_at
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_active_at = NOW() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_active on payment
CREATE TRIGGER update_user_activity
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- Clean up old rate limits (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
