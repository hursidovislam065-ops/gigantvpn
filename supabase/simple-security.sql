-- Простой SQL для защиты. Скопируй и выполни в Supabase SQL Editor.

-- 1. Добавляем device_limit в users (если нет)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS device_limit INT DEFAULT 3;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Добавляем last_active_at
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Ограничения на email
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Ограничения на device_limit
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT device_limit_range CHECK (device_limit >= 1 AND device_limit <= 10);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Ограничения на платформу
DO $$ BEGIN
  ALTER TABLE devices ADD CONSTRAINT platform_check CHECK (platform IN ('ios', 'android', 'windows', 'macos', 'linux', 'unknown'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Ограничения на статус платежа
DO $$ BEGIN
  ALTER TABLE payments ADD CONSTRAINT status_check CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Функция проверки лимита устройств
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

-- 8. Триггер для проверки лимита
DROP TRIGGER IF EXISTS enforce_device_limit ON devices;
CREATE TRIGGER enforce_device_limit
  BEFORE INSERT ON devices
  FOR EACH ROW
  EXECUTE FUNCTION check_device_limit();

-- 9. Таблица rate_limits
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(telegram_id, action, created_at);

-- 10. Функция очистки старых rate limits
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
