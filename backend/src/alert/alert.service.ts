import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { CreateAlertDto, UpdateAlertDto } from './alert.dto';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create(createAlertDto);
    return this.alertRepository.save(alert);
  }

  async findAll(): Promise<Alert[]> {
    return this.alertRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (!alert) {
      throw new NotFoundException(`告警 ${id} 不存在`);
    }
    return alert;
  }

  async findByShipId(shipId: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { shipId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { status: status as Alert['status'] },
      order: { createdAt: 'DESC' },
    });
  }

  async findByLevel(level: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { level: level as Alert['level'] },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveAlerts(): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { status: 'active' },
      order: { level: 'DESC', createdAt: 'DESC' },
    });
  }

  async update(id: string, updateAlertDto: UpdateAlertDto): Promise<Alert> {
    const alert = await this.findById(id);
    Object.assign(alert, updateAlertDto);
    
    if (updateAlertDto.status === 'acknowledged' && !alert.acknowledgedAt) {
      alert.acknowledgedAt = new Date();
    }
    
    if (updateAlertDto.status === 'resolved' && !alert.resolvedAt) {
      alert.resolvedAt = new Date();
    }
    
    return this.alertRepository.save(alert);
  }

  async delete(id: string): Promise<void> {
    const alert = await this.findById(id);
    await this.alertRepository.remove(alert);
  }

  async acknowledge(id: string, acknowledgedBy?: string): Promise<Alert> {
    const alert = await this.findById(id);
    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    return this.alertRepository.save(alert);
  }

  async resolve(id: string, resolvedBy?: string, resolutionNote?: string): Promise<Alert> {
    const alert = await this.findById(id);
    alert.status = 'resolved';
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();
    alert.resolutionNote = resolutionNote;
    return this.alertRepository.save(alert);
  }

  async getAlertStats(): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    byLevel: { level: string; count: number }[];
  }> {
    const total = await this.alertRepository.count();
    const active = await this.alertRepository.count({ where: { status: 'active' } });
    const acknowledged = await this.alertRepository.count({ where: { status: 'acknowledged' } });
    const resolved = await this.alertRepository.count({ where: { status: 'resolved' } });

    const byLevel = await this.alertRepository
      .createQueryBuilder('alert')
      .select('alert.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.level')
      .getRawMany();

    return { total, active, acknowledged, resolved, byLevel };
  }

  async hasActiveDeviationAlert(shipId: string): Promise<boolean> {
    const count = await this.alertRepository.count({
      where: { shipId, type: 'deviation', status: 'active' },
    });
    return count > 0;
  }
}
