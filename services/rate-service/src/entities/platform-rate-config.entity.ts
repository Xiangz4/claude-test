import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MarkupType {
  PIPS = 'pips',
  PERCENTAGE = 'percentage',
}

@Entity('platform_rate_config')
@Index(['channelId', 'currencyPair', 'isActive', 'effectiveFrom'])
@Index(['createdBy', 'createdAt'])
export class PlatformRateConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'channel_id', length: 50 })
  channelId: string;

  @Column({ name: 'currency_pair', length: 10 })
  currencyPair: string;

  @Column({
    name: 'markup_type',
    type: 'varchar',
    length: 20,
    enum: MarkupType,
  })
  markupType: MarkupType;

  @Column({ name: 'markup_value', type: 'decimal', precision: 10, scale: 6 })
  markupValue: number;

  @Column({ name: 'effective_from', type: 'timestamp' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'timestamp', nullable: true })
  effectiveTo: Date | null;

  @Column({ name: 'created_by', length: 100 })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
