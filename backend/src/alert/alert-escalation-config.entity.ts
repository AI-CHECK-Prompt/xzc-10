import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AlertLevel, AlertType } from './alert.entity';

export type EscalationTriggerType = 'time' | 'repeat';

@Entity('alert_escalation_configs')
export class AlertEscalationConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['deviation', 'speed', 'course', 'eta', 'custom'], nullable: true })
  alertType?: AlertType;

  @Column({ nullable: true })
  shipId?: string;

  @Column({ nullable: true })
  region?: string;

  @Column({ type: 'json' })
  levels: EscalationLevel[];

  @Column({ type: 'integer', default: 30 })
  repeatAlertWindowMinutes: number;

  @Column({ type: 'integer', default: 60 })
  notificationIntervalMinutes: number;

  @Column({ type: 'integer', default: 1440 })
  maxEscalationDurationMinutes: number;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface EscalationLevel {
  level: AlertLevel;
  waitMinutes: number;
  notifyTargets: string[];
}
