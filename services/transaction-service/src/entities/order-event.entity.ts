import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { EventType } from '../common/enums';

@Entity('order_events')
@Index(['order_id', 'created_at'])
@Index(['event_type'])
export class OrderEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  order_id: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  event_type: EventType;

  @Column({ type: 'jsonb' })
  event_data: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  triggered_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
