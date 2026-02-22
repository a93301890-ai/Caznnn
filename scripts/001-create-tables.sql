-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'BANNED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAW', 'TRANSFER', 'BONUS', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bet_type AS ENUM ('SINGLE', 'EXPRESS', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bet_status AS ENUM ('PENDING', 'WON', 'LOST', 'VOID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE support_from AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  name          TEXT,
  phone         TEXT,
  currency      TEXT DEFAULT 'RUB',
  balance       NUMERIC(14,2) DEFAULT 0,
  bonus         NUMERIC(14,2) DEFAULT 0,
  refresh_token TEXT,
  role          user_role DEFAULT 'USER',
  status        user_status DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Casino games history
CREATE TABLE IF NOT EXISTS games (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id),
  type       TEXT NOT NULL,
  bet        NUMERIC(14,2) NOT NULL,
  win        NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id),
  type       transaction_type NOT NULL,
  amount     NUMERIC(14,2) NOT NULL,
  status     transaction_status DEFAULT 'PENDING',
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sport events (local cache)
CREATE TABLE IF NOT EXISTS sport_events (
  id         SERIAL PRIMARY KEY,
  sport      TEXT NOT NULL,
  league     TEXT NOT NULL,
  name       TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  status     event_status DEFAULT 'SCHEDULED',
  is_live    BOOLEAN DEFAULT FALSE,
  score      TEXT,
  markets    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bets
CREATE TABLE IF NOT EXISTS bets (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id),
  type          bet_type NOT NULL,
  stake         NUMERIC(14,2) NOT NULL,
  total_odds    NUMERIC(10,4) NOT NULL,
  potential_win NUMERIC(14,2) NOT NULL,
  status        bet_status DEFAULT 'PENDING',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  settled_at    TIMESTAMPTZ
);

-- Bet selections
CREATE TABLE IF NOT EXISTS bet_selections (
  id         SERIAL PRIMARY KEY,
  bet_id     INT NOT NULL REFERENCES bets(id),
  event_id   INT REFERENCES sport_events(id),
  event_name TEXT NOT NULL,
  market     TEXT NOT NULL,
  outcome    TEXT,
  odd        NUMERIC(10,4) NOT NULL
);

-- Action logs
CREATE TABLE IF NOT EXISTS action_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  action     TEXT NOT NULL,
  meta       JSONB,
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password resets
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id),
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KYC requests
CREATE TABLE IF NOT EXISTS kyc_requests (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id),
  status     kyc_status DEFAULT 'PENDING',
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id),
  "from"     support_from NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_games_user ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_selections_bet ON bet_selections(bet_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_user ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_user ON kyc_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON support_messages(user_id);
