-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  agent_wallet VARCHAR(44),
  status VARCHAR(20) DEFAULT 'connected', -- 'connected', 'trading', 'paused'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  symbol VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'long', 'short'
  entry_price DECIMAL,
  size DECIMAL,
  tp1 DECIMAL,
  tp2 DECIMAL,
  sl DECIMAL,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'tp1', 'tp2', 'sl', 'closed'
  pnl DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
