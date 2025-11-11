import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('quote_locks')
@Index(['merchant_id', 'is_used'])
@Index(['lock_expires_at'])
export class QuoteLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  merchant_id: string;

  @Column({ type: 'varchar', length: 20 })
  currency_pair: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  locked_rate: string;

  @Column({ type: 'varchar', length: 10 })
  sell_currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  sell_amount: string;

  @Column({ type: 'varchar', length: 10 })
  buy_currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  buy_amount: string;

  @Column({ type: 'timestamp' })
  lock_expires_at: Date;

  @Column({ type: 'boolean', default: false })
  is_used: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  order_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  rate_details: Record<string, any>;
}
