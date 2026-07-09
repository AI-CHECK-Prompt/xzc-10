import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Alert } from './alert.entity';
import { AlertLevel } from './alert-rule.entity';

export type EscalationAction = 'auto' | 'manual';

@Entity('alert_escalation_records')
export class AlertEscalationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Alert, alert => alert.escalationRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alertId' })
  alert: Alert;

  @Column()
  alertId: string;

  @Column({ type: 'enum', enum: ['low', 'medium', 'high', 'critical'] })
  fromLevel: AlertLevel;

  @Column({ type: 'enum', enum: ['low', 'medium', 'high', 'critical'] })
  toLevel: AlertLevel;

  @Column({ type: 'enum', enum: ['auto', 'manual'] })
  action: EscalationAction;

  @Column({ nullable: true })
  operatorId?: string;

  @Column({ nullable: true })
  operatorName?: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({ nullable: true })
  configId?: string;

  @Column({ type: 'json', nullable: true })
  notifiedTargets?: string[];

  @Column({ type: 'json', nullable: true })
  notificationStatus?: EscalationNotificationStatus[];

  @CreateDateColumn()
  createdAt: Date;
}

export interface EscalationNotificationStatus {
  target: string;
  sent: boolean;
  sentAt?: Date;
  status?: 'pending' | 'sent' | 'failed';
}
