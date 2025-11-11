-- Migration: 002_create_transaction_tables.sql
-- Description: Create transaction service tables (exchange_orders, order_events, quote_locks)
-- Author: FX Platform Team
-- Date: 2025-11-12

-- ============================================
-- Table: exchange_orders
-- Description: Stores exchange order information
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id VARCHAR(100) NOT NULL,
    quote_id VARCHAR(100) NOT NULL,

    -- Planned amounts (from customer quote)
    planned_sell_currency VARCHAR(10) NOT NULL,
    planned_sell_amount DECIMAL(18, 2) NOT NULL CHECK (planned_sell_amount > 0),
    planned_buy_currency VARCHAR(10) NOT NULL,
    planned_buy_amount DECIMAL(18, 2) NOT NULL CHECK (planned_buy_amount > 0),
    customer_rate DECIMAL(18, 8) NOT NULL CHECK (customer_rate > 0),

    -- Order status
    order_status VARCHAR(50) NOT NULL DEFAULT 'order_created',

    -- Channel information
    channel_id VARCHAR(50),
    channel_inquiry_id VARCHAR(100),
    channel_order_id VARCHAR(100),

    -- Actual execution amounts (from channel)
    actual_sell_amount DECIMAL(18, 2) CHECK (actual_sell_amount > 0),
    actual_buy_amount DECIMAL(18, 2) CHECK (actual_buy_amount > 0),
    actual_rate DECIMAL(18, 8) CHECK (actual_rate > 0),

    -- Financial tracking
    cost_amount DECIMAL(18, 2),
    profit_amount DECIMAL(18, 2),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Additional metadata
    metadata JSONB,
    failure_reason TEXT,

    -- Constraints
    CONSTRAINT valid_currency_pair CHECK (planned_sell_currency <> planned_buy_currency),
    CONSTRAINT valid_order_status CHECK (order_status IN (
        'quote_locked',
        'order_created',
        'fx_inquiring',
        'fx_executing',
        'fx_success',
        'fx_failed',
        'settlement_processing',
        'settlement_success',
        'settlement_failed',
        'order_completed',
        'order_closed',
        'order_cancelled'
    ))
);

-- Indexes for exchange_orders
CREATE INDEX idx_exchange_orders_merchant ON exchange_orders(merchant_id);
CREATE INDEX idx_exchange_orders_status ON exchange_orders(order_status);
CREATE INDEX idx_exchange_orders_created_at ON exchange_orders(created_at DESC);
CREATE INDEX idx_exchange_orders_merchant_status_created ON exchange_orders(merchant_id, order_status, created_at DESC);
CREATE INDEX idx_exchange_orders_quote_id ON exchange_orders(quote_id);
CREATE INDEX idx_exchange_orders_channel_order_id ON exchange_orders(channel_order_id) WHERE channel_order_id IS NOT NULL;

-- Comments for exchange_orders
COMMENT ON TABLE exchange_orders IS 'Exchange order records for FX transactions';
COMMENT ON COLUMN exchange_orders.merchant_id IS 'ID of the merchant placing the order';
COMMENT ON COLUMN exchange_orders.quote_id IS 'ID of the locked quote used for this order';
COMMENT ON COLUMN exchange_orders.order_status IS 'Current status of the order in the saga workflow';
COMMENT ON COLUMN exchange_orders.customer_rate IS 'Exchange rate shown to customer (with markup)';
COMMENT ON COLUMN exchange_orders.actual_rate IS 'Actual rate received from channel';
COMMENT ON COLUMN exchange_orders.profit_amount IS 'Platform profit = planned_sell_amount - actual_sell_amount';

-- ============================================
-- Table: order_events
-- Description: Event log for order state changes
-- ============================================
CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    triggered_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,

    -- Constraints
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'order_created',
        'order_updated',
        'order_cancelled',
        'fx_inquiry_initiated',
        'fx_inquiry_completed',
        'fx_execution_started',
        'fx_execution_completed',
        'fx_execution_failed',
        'settlement_initiated',
        'settlement_completed',
        'settlement_failed',
        'order_completed',
        'order_closed'
    ))
);

-- Indexes for order_events
CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_order_events_created_at ON order_events(created_at DESC);
CREATE INDEX idx_order_events_order_created ON order_events(order_id, created_at DESC);
CREATE INDEX idx_order_events_event_type ON order_events(event_type);

-- Comments for order_events
COMMENT ON TABLE order_events IS 'Immutable event log for all order state changes';
COMMENT ON COLUMN order_events.order_id IS 'ID of the related exchange order';
COMMENT ON COLUMN order_events.event_type IS 'Type of event that occurred';
COMMENT ON COLUMN order_events.event_data IS 'JSON payload containing event details';
COMMENT ON COLUMN order_events.triggered_by IS 'User or system component that triggered the event';

-- ============================================
-- Table: quote_locks
-- Description: Locked quote records (30 second TTL)
-- ============================================
CREATE TABLE IF NOT EXISTS quote_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id VARCHAR(100) NOT NULL,
    currency_pair VARCHAR(20) NOT NULL,
    locked_rate DECIMAL(18, 8) NOT NULL CHECK (locked_rate > 0),

    -- Amount details
    sell_currency VARCHAR(10) NOT NULL,
    sell_amount DECIMAL(18, 2) NOT NULL CHECK (sell_amount > 0),
    buy_currency VARCHAR(10) NOT NULL,
    buy_amount DECIMAL(18, 2) NOT NULL CHECK (buy_amount > 0),

    -- Lock management
    lock_expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    order_id VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Additional rate calculation details
    rate_details JSONB,

    -- Constraints
    CONSTRAINT valid_lock_expiry CHECK (lock_expires_at > created_at),
    CONSTRAINT valid_currency_pair_lock CHECK (sell_currency <> buy_currency)
);

-- Indexes for quote_locks
CREATE INDEX idx_quote_locks_merchant ON quote_locks(merchant_id);
CREATE INDEX idx_quote_locks_expires_at ON quote_locks(lock_expires_at);
CREATE INDEX idx_quote_locks_merchant_used ON quote_locks(merchant_id, is_used);
CREATE INDEX idx_quote_locks_order_id ON quote_locks(order_id) WHERE order_id IS NOT NULL;

-- Comments for quote_locks
COMMENT ON TABLE quote_locks IS 'Locked rate quotes with 30-second expiry';
COMMENT ON COLUMN quote_locks.locked_rate IS 'Rate locked for customer (includes platform markup)';
COMMENT ON COLUMN quote_locks.lock_expires_at IS 'Expiration timestamp (created_at + 30 seconds)';
COMMENT ON COLUMN quote_locks.is_used IS 'Whether this quote has been used to create an order';
COMMENT ON COLUMN quote_locks.rate_details IS 'JSON containing channel rate, platform markup, merchant markup details';

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exchange_orders_updated_at
    BEFORE UPDATE ON exchange_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Functions for quote lock cleanup
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_quote_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM quote_locks
    WHERE lock_expires_at < CURRENT_TIMESTAMP
      AND is_used = FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_quote_locks IS 'Remove expired, unused quote locks (run via cron job)';

-- ============================================
-- Migration Complete
-- ============================================
-- This migration creates:
-- 1. exchange_orders table with comprehensive order tracking
-- 2. order_events table for immutable event log (Saga pattern)
-- 3. quote_locks table for 30-second rate locks
-- 4. Appropriate indexes for query performance
-- 5. Triggers for automatic timestamp updates
-- 6. Helper function for cleanup operations
