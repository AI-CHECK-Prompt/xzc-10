import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AlertLevel } from './alert-rule.entity';
export { AlertLevel } from './alert-rule.entity';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type AlertType = 'deviation' | 'speed' | 'course' | 'eta' | 'custom';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['deviation', 'speed', 'course', 'eta', 'custom'], default: 'deviation' })
  type: AlertType;

  @Column({ type: 'enum', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  level: AlertLevel;

  @Column({ type: 'enum', enum: ['active', 'acknowledged', 'resolved'], default: 'active' })
  status: AlertStatus;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column()
  shipId: string;

  @Column({ nullable: true })
  shipName: string;

  @Column({ nullable: true })
  shipCode: string;

  @Column({ nullable: true })
  routeId: string;

  @Column({ nullable: true })
  routeName: string;

  @Column({ type: 'decimal', nullable: true })
  deviationDistance: number;

  @Column({ type: 'decimal', nullable: true })
  threshold: number;

  @Column({ type: 'decimal', nullable: true })
  latitude: number;

  @Column({ type: 'decimal', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  ruleId: string;

  @Column({ nullable: true })
  acknowledgedBy: string;

  @Column({ nullable: true })
  acknowledgedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolutionNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
