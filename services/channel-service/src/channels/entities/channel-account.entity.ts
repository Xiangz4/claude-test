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

@Entity('channel_accounts')
export class ChannelAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'channel_id', type: 'uuid' })
  channelId: string;

  @ManyToOne(() => Channel, (channel) => channel.accounts)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @Column({ name: 'account_number', length: 100 })
  accountNumber: string;

  @Column({ name: 'account_name', length: 200, nullable: true })
  accountName: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'available_balance', type: 'decimal', precision: 20, scale: 2, default: 0 })
  availableBalance: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ name: 'account_type', length: 50, nullable: true })
  accountType: string;

  @Column({ name: 'last_synced_at', type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ name: 'sync_status', length: 50, default: 'pending' })
  syncStatus: string;

  @Column({ name: 'sync_error', type: 'text', nullable: true })
  syncError: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
