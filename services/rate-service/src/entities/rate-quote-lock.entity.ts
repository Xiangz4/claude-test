import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum QuoteLockStatus {
  LOCKED = 'locked',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('rate_quote_locks')
@Index(['quoteId', 'status'])
@Index(['merchantId', 'createdAt'])
@Index(['expiresAt', 'status'])
export class RateQuoteLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quote_id', length: 100, unique: true })
  quoteId: string;

  @Column({ name: 'merchant_id', length: 100 })
  merchantId: string;

  @Column({ name: 'currency_pair', length: 10 })
  currencyPair: string;

  @Column({ name: 'rate', type: 'decimal', precision: 18, scale: 8 })
  rate: number;

  @Column({ name: 'sell_currency', length: 3 })
  sellCurrency: string;

  @Column({ name: 'sell_amount', type: 'decimal', precision: 18, scale: 2 })
  sellAmount: number;

  @Column({ name: 'buy_currency', length: 3 })
  buyCurrency: string;

  @Column({ name: 'buy_amount', type: 'decimal', precision: 18, scale: 2 })
  buyAmount: number;

  @Column({ name: 'locked_at', type: 'timestamp' })
  lockedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    enum: QuoteLockStatus,
    default: QuoteLockStatus.LOCKED,
  })
  status: QuoteLockStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
