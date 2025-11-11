-- Migration: Create Channel Service Tables
-- Description: Creates tables for channel configuration, accounts, and transactions
-- Author: System Architect - Stream C
-- Date: 2025-11-12

-- =====================================================
-- Table: channels
-- Description: Stores payment channel configurations
-- =====================================================
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(50) NOT NULL, -- 'PHP', 'BOCHK', 'Leptage'
    api_endpoint VARCHAR(255) NOT NULL,
    api_credentials_encrypted TEXT NOT NULL, -- Encrypted JSON with API keys/secrets
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- For channel fallback ordering
    max_transaction_amount DECIMAL(20, 2),
    min_transaction_amount DECIMAL(20, 2),
    supported_currencies TEXT[], -- Array of currency codes
    configuration JSONB, -- Channel-specific configuration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT unique_channel_name UNIQUE (channel_name)
);

-- Create index for active channels lookup
CREATE INDEX idx_channels_active ON channels(is_active, priority);
CREATE INDEX idx_channels_type ON channels(channel_type);

-- =====================================================
-- Table: channel_accounts
-- Description: Stores account balances for each channel
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    account_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(200),
    balance DECIMAL(20, 2) DEFAULT 0.00,
    available_balance DECIMAL(20, 2) DEFAULT 0.00, -- Balance minus frozen funds
    currency VARCHAR(3) NOT NULL,
    account_type VARCHAR(50), -- 'settlement', 'prefund', etc.
    last_synced_at TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    sync_error TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_channel_account UNIQUE (channel_id, account_number, currency)
);

-- Create indexes for account lookups
CREATE INDEX idx_channel_accounts_channel ON channel_accounts(channel_id);
CREATE INDEX idx_channel_accounts_currency ON channel_accounts(currency);
CREATE INDEX idx_channel_accounts_active ON channel_accounts(is_active);

-- =====================================================
-- Table: channel_transactions
-- Description: Records all transactions with external channels
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id),
    order_id VARCHAR(100), -- Internal order ID reference
    transaction_type VARCHAR(50) NOT NULL, -- 'inquiry', 'exchange', 'transfer', 'settlement'
    direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
    sell_currency VARCHAR(3),
    sell_amount DECIMAL(20, 2),
    buy_currency VARCHAR(3),
    buy_amount DECIMAL(20, 2),
    exchange_rate DECIMAL(20, 10),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'success', 'failed', 'cancelled'
    external_reference VARCHAR(200), -- Channel's transaction ID
    request_payload JSONB, -- Full API request
    response_payload JSONB, -- Full API response
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for transaction queries
CREATE INDEX idx_channel_transactions_channel ON channel_transactions(channel_id);
CREATE INDEX idx_channel_transactions_order ON channel_transactions(order_id);
CREATE INDEX idx_channel_transactions_status ON channel_transactions(status);
CREATE INDEX idx_channel_transactions_type ON channel_transactions(transaction_type);
CREATE INDEX idx_channel_transactions_external_ref ON channel_transactions(external_reference);
CREATE INDEX idx_channel_transactions_created ON channel_transactions(created_at DESC);

-- =====================================================
-- Table: channel_rate_history
-- Description: Stores historical exchange rates from channels
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id),
    currency_pair VARCHAR(10) NOT NULL, -- 'USD/HKD'
    bid_rate DECIMAL(20, 10), -- Buy rate (what channel pays)
    ask_rate DECIMAL(20, 10), -- Sell rate (what channel charges)
    mid_rate DECIMAL(20, 10), -- Middle rate
    spread DECIMAL(20, 10), -- ask_rate - bid_rate
    fetch_time TIMESTAMP NOT NULL,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for rate lookups
CREATE INDEX idx_channel_rate_history_channel ON channel_rate_history(channel_id);
CREATE INDEX idx_channel_rate_history_pair ON channel_rate_history(currency_pair);
CREATE INDEX idx_channel_rate_history_fetch_time ON channel_rate_history(fetch_time DESC);
CREATE INDEX idx_channel_rate_history_lookup ON channel_rate_history(channel_id, currency_pair, fetch_time DESC);

-- =====================================================
-- Table: channel_health_checks
-- Description: Monitors channel API health and availability
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id),
    check_type VARCHAR(50) NOT NULL, -- 'connectivity', 'rate_fetch', 'transaction'
    status VARCHAR(50) NOT NULL, -- 'healthy', 'degraded', 'down'
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for health monitoring
CREATE INDEX idx_channel_health_checks_channel ON channel_health_checks(channel_id);
CREATE INDEX idx_channel_health_checks_checked_at ON channel_health_checks(checked_at DESC);
CREATE INDEX idx_channel_health_checks_status ON channel_health_checks(status);

-- =====================================================
-- Function: Update updated_at timestamp automatically
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_accounts_updated_at BEFORE UPDATE ON channel_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_transactions_updated_at BEFORE UPDATE ON channel_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Seed Data: Initial Channel Configurations
-- =====================================================
-- Note: Credentials should be encrypted in production
INSERT INTO channels (channel_name, channel_type, api_endpoint, api_credentials_encrypted, is_active, priority, supported_currencies) VALUES
    ('PHP Channel', 'PHP', 'https://api.php-channel.example.com', 'ENCRYPTED_CREDENTIALS_HERE', true, 1, ARRAY['USD', 'HKD', 'CNY', 'EUR', 'GBP']),
    ('BOCHK Channel', 'BOCHK', 'https://mds1a.trkdhs.com/bochkfxibs/mktinfo', 'ENCRYPTED_CREDENTIALS_HERE', true, 2, ARRAY['USD', 'HKD', 'CNY', 'EUR', 'GBP', 'JPY', 'AUD']),
    ('Leptage Channel', 'Leptage', 'https://api.leptage.example.com', 'ENCRYPTED_CREDENTIALS_HERE', false, 3, ARRAY['USDT', 'USDC', 'BTC', 'ETH'])
ON CONFLICT (channel_name) DO NOTHING;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE channels IS 'Configuration for external payment/exchange channels';
COMMENT ON TABLE channel_accounts IS 'Account balances maintained at each channel';
COMMENT ON TABLE channel_transactions IS 'Complete audit log of all channel interactions';
COMMENT ON TABLE channel_rate_history IS 'Historical exchange rates from channels';
COMMENT ON TABLE channel_health_checks IS 'Channel API health monitoring data';

COMMENT ON COLUMN channels.api_credentials_encrypted IS 'Encrypted JSON containing API keys, secrets, and auth tokens';
COMMENT ON COLUMN channels.priority IS 'Lower number = higher priority for channel selection';
COMMENT ON COLUMN channel_accounts.available_balance IS 'Balance available for transactions (balance - frozen)';
COMMENT ON COLUMN channel_transactions.transaction_type IS 'Type of operation: inquiry (quote), exchange (execute), transfer (funds), settlement (payout)';
