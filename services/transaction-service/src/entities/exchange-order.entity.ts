import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OrderStatus } from '../common/enums';

@Entity('exchange_orders')
@Index(['merchant_id', 'order_status', 'created_at'])
@Index(['quote_id'])
export class ExchangeOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  merchant_id: string;

  @Column({ type: 'varchar', length: 100 })
  quote_id: string;

  // Planned amounts (from customer quote)
  @Column({ type: 'varchar', length: 10 })
  planned_sell_currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  planned_sell_amount: string;

  @Column({ type: 'varchar', length: 10 })
  planned_buy_currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  planned_buy_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  customer_rate: string;

  // Order status
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.ORDER_CREATED,
  })
  @Index()
  order_status: OrderStatus;

  // Channel information
  @Column({ type: 'varchar', length: 50, nullable: true })
  channel_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  channel_inquiry_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  channel_order_id: string;

  // Actual execution amounts (from channel)
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  actual_sell_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  actual_buy_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  actual_rate: string;

  // Financial tracking
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  cost_amount: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  profit_amount: string;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  executed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;
}
