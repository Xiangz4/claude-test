import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChannelAccount } from './channel-account.entity';
import { ChannelTransaction } from './channel-transaction.entity';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'channel_name', length: 100, unique: true })
  channelName: string;

  @Column({ name: 'channel_type', length: 50 })
  channelType: string;

  @Column({ name: 'api_endpoint', length: 255 })
  apiEndpoint: string;

  @Column({ name: 'api_credentials_encrypted', type: 'text' })
  apiCredentialsEncrypted: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'priority', default: 0 })
  priority: number;

  @Column({ name: 'max_transaction_amount', type: 'decimal', precision: 20, scale: 2, nullable: true })
  maxTransactionAmount: number;

  @Column({ name: 'min_transaction_amount', type: 'decimal', precision: 20, scale: 2, nullable: true })
  minTransactionAmount: number;

  @Column({ name: 'supported_currencies', type: 'text', array: true, nullable: true })
  supportedCurrencies: string[];

  @Column({ name: 'configuration', type: 'jsonb', nullable: true })
  configuration: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy: string;

  @OneToMany(() => ChannelAccount, (account) => account.channel)
  accounts: ChannelAccount[];

  @OneToMany(() => ChannelTransaction, (transaction) => transaction.channel)
  transactions: ChannelTransaction[];
}
