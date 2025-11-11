-- Migration: Create Rate Service Tables
-- Description: Creates tables for channel rates, platform rate config, and merchant rate config
-- Author: FX Platform Team
-- Date: 2025-11-12

-- ============================================================================
-- Table: channel_rates
-- Description: Stores real-time exchange rates fetched from channels (PHP, BOCHK, Leptage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS channel_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id VARCHAR(50) NOT NULL,  -- 'PHP', 'BOCHK', 'LEPTAGE'
    currency_pair VARCHAR(10) NOT NULL,  -- 'USD/HKD', 'EUR/USD', etc.
    bid_rate DECIMAL(18, 8) NOT NULL,  -- Buy price (bid)
    ask_rate DECIMAL(18, 8) NOT NULL,  -- Sell price (ask)
    mid_rate DECIMAL(18, 8) NOT NULL,  -- Mid price
    fetch_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for fast lookups
    CONSTRAINT channel_rates_channel_currency_idx UNIQUE (channel_id, currency_pair, fetch_time)
);

-- Index for querying latest rates by channel and currency pair
CREATE INDEX idx_channel_rates_lookup ON channel_rates (channel_id, currency_pair, fetch_time DESC);

-- Index for cleaning up old rates
CREATE INDEX idx_channel_rates_created_at ON channel_rates (created_at);

-- Add comments
COMMENT ON TABLE channel_rates IS 'Real-time exchange rates fetched from external channels';
COMMENT ON COLUMN channel_rates.channel_id IS 'Source channel: PHP, BOCHK, or LEPTAGE';
COMMENT ON COLUMN channel_rates.currency_pair IS 'Currency pair in format BASE/QUOTE (e.g., USD/HKD)';
COMMENT ON COLUMN channel_rates.bid_rate IS 'Buy price (what channel will pay for base currency)';
COMMENT ON COLUMN channel_rates.ask_rate IS 'Sell price (what channel will charge for base currency)';
COMMENT ON COLUMN channel_rates.mid_rate IS 'Mid price: (bid_rate + ask_rate) / 2';
COMMENT ON COLUMN channel_rates.valid_until IS 'Rate expiration time (typically fetch_time + 5 minutes)';

-- ============================================================================
-- Table: platform_rate_config
-- Description: Platform markup configuration on top of channel rates
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_rate_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id VARCHAR(50) NOT NULL,
    currency_pair VARCHAR(10) NOT NULL,

    -- Markup configuration
    markup_type VARCHAR(20) NOT NULL CHECK (markup_type IN ('pips', 'percentage')),
    markup_value DECIMAL(10, 6) NOT NULL,  -- Pips (e.g., 50) or percentage (e.g., 0.5 for 0.5%)

    -- Effective period
    effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP,  -- NULL means no end date

    -- Audit fields
    created_by VARCHAR(100) NOT NULL,  -- User ID or system identifier
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Ensure only one active config per channel-currency pair at a time
    CONSTRAINT platform_rate_config_active_unique
        EXCLUDE USING gist (
            channel_id WITH =,
            currency_pair WITH =,
            tsrange(effective_from, COALESCE(effective_to, 'infinity'::timestamp)) WITH &&
        ) WHERE (is_active = true)
);

-- Index for querying active configs
CREATE INDEX idx_platform_rate_config_active ON platform_rate_config (channel_id, currency_pair, is_active, effective_from);

-- Index for audit queries
CREATE INDEX idx_platform_rate_config_created_by ON platform_rate_config (created_by, created_at);

-- Add comments
COMMENT ON TABLE platform_rate_config IS 'Platform markup configuration applied on top of channel rates';
COMMENT ON COLUMN platform_rate_config.markup_type IS 'Markup calculation method: pips (fixed points) or percentage';
COMMENT ON COLUMN platform_rate_config.markup_value IS 'Markup amount: pips count or percentage value';
COMMENT ON COLUMN platform_rate_config.effective_from IS 'Configuration start time';
COMMENT ON COLUMN platform_rate_config.effective_to IS 'Configuration end time (NULL for no end)';

-- ============================================================================
-- Table: merchant_rate_config
-- Description: Merchant-specific rate configuration and custom pricing
-- ============================================================================
CREATE TABLE IF NOT EXISTS merchant_rate_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id VARCHAR(100) NOT NULL,
    currency_pair VARCHAR(10) NOT NULL,

    -- Pricing configuration
    pricing_type VARCHAR(20) NOT NULL CHECK (pricing_type IN ('platform', 'custom', 'markup')),
    custom_rate DECIMAL(18, 8),  -- Fixed custom rate (only for pricing_type='custom')
    markup_value DECIMAL(10, 6),  -- Additional markup on platform rate (for pricing_type='markup')

    -- Approval workflow
    approval_status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    rejection_reason TEXT,

    -- Effective period
    effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Audit fields
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Ensure only one active config per merchant-currency pair at a time
    CONSTRAINT merchant_rate_config_active_unique
        EXCLUDE USING gist (
            merchant_id WITH =,
            currency_pair WITH =,
            tsrange(effective_from, COALESCE(effective_to, 'infinity'::timestamp)) WITH &&
        ) WHERE (is_active = true AND approval_status = 'approved')
);

-- Index for merchant lookups
CREATE INDEX idx_merchant_rate_config_lookup ON merchant_rate_config (merchant_id, currency_pair, is_active, approval_status);

-- Index for approval workflow
CREATE INDEX idx_merchant_rate_config_approval ON merchant_rate_config (approval_status, created_at);

-- Index for audit queries
CREATE INDEX idx_merchant_rate_config_audit ON merchant_rate_config (created_by, created_at);

-- Add comments
COMMENT ON TABLE merchant_rate_config IS 'Merchant-specific rate configuration and custom pricing';
COMMENT ON COLUMN merchant_rate_config.pricing_type IS 'Pricing mode: platform (use platform rate), custom (fixed rate), markup (platform + additional markup)';
COMMENT ON COLUMN merchant_rate_config.custom_rate IS 'Fixed custom rate for pricing_type=custom';
COMMENT ON COLUMN merchant_rate_config.markup_value IS 'Additional markup percentage for pricing_type=markup';
COMMENT ON COLUMN merchant_rate_config.approval_status IS 'Workflow status: pending, approved, rejected';

-- ============================================================================
-- Table: rate_quote_locks
-- Description: 30-second rate quote locks for order creation
-- Note: This table is primarily for audit; actual locks are stored in Redis
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_quote_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id VARCHAR(100) NOT NULL UNIQUE,
    merchant_id VARCHAR(100) NOT NULL,
    currency_pair VARCHAR(10) NOT NULL,

    -- Locked rate details
    rate DECIMAL(18, 8) NOT NULL,
    sell_currency VARCHAR(3) NOT NULL,
    sell_amount DECIMAL(18, 2) NOT NULL,
    buy_currency VARCHAR(3) NOT NULL,
    buy_amount DECIMAL(18, 2) NOT NULL,

    -- Lock timing
    locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    -- Usage tracking
    used_at TIMESTAMP,
    order_id UUID,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'used', 'expired', 'cancelled')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for quote validation
CREATE INDEX idx_rate_quote_locks_quote_id ON rate_quote_locks (quote_id, status);

-- Index for merchant query
CREATE INDEX idx_rate_quote_locks_merchant ON rate_quote_locks (merchant_id, created_at DESC);

-- Index for cleanup
CREATE INDEX idx_rate_quote_locks_expires_at ON rate_quote_locks (expires_at, status);

-- Add comments
COMMENT ON TABLE rate_quote_locks IS 'Audit log of rate quote locks (actual locks stored in Redis with 30s TTL)';
COMMENT ON COLUMN rate_quote_locks.quote_id IS 'Unique quote identifier';
COMMENT ON COLUMN rate_quote_locks.expires_at IS 'Lock expiration time (locked_at + 30 seconds)';
COMMENT ON COLUMN rate_quote_locks.status IS 'Lock status: locked, used (order created), expired, cancelled';

-- ============================================================================
-- Function: Update updated_at timestamp automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach triggers to tables with updated_at column
CREATE TRIGGER update_platform_rate_config_updated_at BEFORE UPDATE ON platform_rate_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_rate_config_updated_at BEFORE UPDATE ON merchant_rate_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Cleanup old channel rates (keep last 30 days)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_channel_rates()
RETURNS void AS $$
BEGIN
    DELETE FROM channel_rates
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Expire old quote locks
-- ============================================================================
CREATE OR REPLACE FUNCTION expire_old_quote_locks()
RETURNS void AS $$
BEGIN
    UPDATE rate_quote_locks
    SET status = 'expired'
    WHERE status = 'locked'
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Initial seed data (optional)
-- ============================================================================

-- Insert default platform rate config for common currency pairs
INSERT INTO platform_rate_config (channel_id, currency_pair, markup_type, markup_value, created_by)
VALUES
    ('PHP', 'USD/HKD', 'pips', 50, 'SYSTEM'),
    ('PHP', 'EUR/HKD', 'pips', 50, 'SYSTEM'),
    ('PHP', 'GBP/HKD', 'pips', 50, 'SYSTEM'),
    ('BOCHK', 'USD/HKD', 'pips', 30, 'SYSTEM'),
    ('BOCHK', 'EUR/HKD', 'pips', 30, 'SYSTEM'),
    ('LEPTAGE', 'USDT/USD', 'percentage', 0.5, 'SYSTEM')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Grant permissions (adjust based on your user setup)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rate_service_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rate_service_user;

-- ============================================================================
-- Migration complete
-- ============================================================================
