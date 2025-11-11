import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Channel } from './channel.entity';

@Entity('channel_transactions')
export class ChannelTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'channel_id', type: 'uuid' })
  channelId: string;

  @ManyToOne(() => Channel, (channel) => channel.transactions)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @Column({ name: 'order_id', length: 100, nullable: true })
  orderId: string;

  @Column({ name: 'transaction_type', length: 50 })
  transactionType: string;

  @Column({ length: 10 })
  direction: string;

  @Column({ name: 'sell_currency', length: 3, nullable: true })
  sellCurrency: string;

  @Column({ name: 'sell_amount', type: 'decimal', precision: 20, scale: 2, nullable: true })
  sellAmount: number;

  @Column({ name: 'buy_currency', length: 3, nullable: true })
  buyCurrency: string;

  @Column({ name: 'buy_amount', type: 'decimal', precision: 20, scale: 2, nullable: true })
  buyAmount: number;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 20, scale: 10, nullable: true })
  exchangeRate: number;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ name: 'external_reference', length: 200, nullable: true })
  externalReference: string;

  @Column({ name: 'request_payload', type: 'jsonb', nullable: true })
  requestPayload: any;

  @Column({ name: 'response_payload', type: 'jsonb', nullable: true })
  responsePayload: any;

  @Column({ name: 'error_code', length: 50, nullable: true })
  errorCode: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'last_retry_at', type: 'timestamp', nullable: true })
  lastRetryAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
