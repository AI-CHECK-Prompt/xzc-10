import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ship } from '../ship/ship.entity';

export interface Waypoint {
  latitude: number;
  longitude: number;
  name?: string;
  order: number;
}

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  routeCode: string;

  @Column()
  name: string;

  @ManyToOne(() => Ship)
  @JoinColumn({ name: 'shipId' })
  ship: Ship;

  @Column()
  shipId: string;

  @Column({ type: 'jsonb' })
  waypoints: Waypoint[];

  @Column({ nullable: true })
  startPort: string;

  @Column({ nullable: true })
  endPort: string;

  @Column({ type: 'decimal', nullable: true })
  totalDistance: number;

  @Column({ nullable: true })
  estimatedTime: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
