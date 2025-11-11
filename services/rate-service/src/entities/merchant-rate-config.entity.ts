import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PricingType {
  PLATFORM = 'platform',
  CUSTOM = 'custom',
  MARKUP = 'markup',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('merchant_rate_config')
@Index(['merchantId', 'currencyPair', 'isActive', 'approvalStatus'])
@Index(['approvalStatus', 'createdAt'])
@Index(['createdBy', 'createdAt'])
export class MerchantRateConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id', length: 100 })
  merchantId: string;

  @Column({ name: 'currency_pair', length: 10 })
  currencyPair: string;

  @Column({
    name: 'pricing_type',
    type: 'varchar',
    length: 20,
    enum: PricingType,
  })
  pricingType: PricingType;

  @Column({
    name: 'custom_rate',
    type: 'decimal',
    precision: 18,
    scale: 8,
    nullable: true,
  })
  customRate: number | null;

  @Column({
    name: 'markup_value',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
  })
  markupValue: number | null;

  @Column({
    name: 'approval_status',
    type: 'varchar',
    length: 20,
    enum: ApprovalStatus,
    default: ApprovalStatus.APPROVED,
  })
  approvalStatus: ApprovalStatus;

  @Column({ name: 'approved_by', length: 100, nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'effective_from', type: 'timestamp' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'timestamp', nullable: true })
  effectiveTo: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', length: 100 })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
