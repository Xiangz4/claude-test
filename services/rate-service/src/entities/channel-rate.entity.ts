import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('channel_rates')
@Index(['channelId', 'currencyPair', 'fetchTime'], { unique: true })
@Index(['channelId', 'currencyPair', 'fetchTime'])
@Index(['createdAt'])
export class ChannelRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'channel_id', length: 50 })
  channelId: string;

  @Column({ name: 'currency_pair', length: 10 })
  currencyPair: string;

  @Column({ name: 'bid_rate', type: 'decimal', precision: 18, scale: 8 })
  bidRate: number;

  @Column({ name: 'ask_rate', type: 'decimal', precision: 18, scale: 8 })
  askRate: number;

  @Column({ name: 'mid_rate', type: 'decimal', precision: 18, scale: 8 })
  midRate: number;

  @Column({ name: 'fetch_time', type: 'timestamp' })
  fetchTime: Date;

  @Column({ name: 'valid_until', type: 'timestamp' })
  validUntil: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
