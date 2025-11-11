export enum OrderStatus {
  QUOTE_LOCKED = 'quote_locked',
  ORDER_CREATED = 'order_created',
  FX_INQUIRING = 'fx_inquiring',
  FX_EXECUTING = 'fx_executing',
  FX_SUCCESS = 'fx_success',
  FX_FAILED = 'fx_failed',
  SETTLEMENT_PROCESSING = 'settlement_processing',
  SETTLEMENT_SUCCESS = 'settlement_success',
  SETTLEMENT_FAILED = 'settlement_failed',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CLOSED = 'order_closed',
  ORDER_CANCELLED = 'order_cancelled',
}
