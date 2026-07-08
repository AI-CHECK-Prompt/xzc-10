import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ships')
export class Ship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  shipCode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  imoNumber: string;

  @Column({ nullable: true })
  mmsi: string;

  @Column({ nullable: true })
  callSign: string;

  @Column({ nullable: true })
  flag: string;

  @Column({ nullable: true })
  type: string;

  @Column({ type: 'decimal', nullable: true })
  length: number;

  @Column({ type: 'decimal', nullable: true })
  width: number;

  @Column({ type: 'decimal', nullable: true })
  draft: number;

  @Column({ type: 'decimal', nullable: true })
  tonnage: number;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
