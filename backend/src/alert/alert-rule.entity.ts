import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

@Entity('alert_rules')
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', default: 1000 })
  deviationThreshold: number;

  @Column({ type: 'enum', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  level: AlertLevel;

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: false })
  notifyOnCreation: boolean;

  @Column({ default: false })
  notifyOnUpdate: boolean;

  @Column({ nullable: true })
  shipId: string;

  @Column({ nullable: true })
  routeId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
