import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEscalationConfig } from './alert-escalation-config.entity';
import { CreateAlertEscalationConfigDto, UpdateAlertEscalationConfigDto } from './alert-escalation-config.dto';
import { AlertType } from './alert.entity';

@Injectable()
export class AlertEscalationConfigService {
  constructor(
    @InjectRepository(AlertEscalationConfig)
    private escalationConfigRepository: Repository<AlertEscalationConfig>,
  ) {}

  async create(createDto: CreateAlertEscalationConfigDto): Promise<AlertEscalationConfig> {
    const config = this.escalationConfigRepository.create(createDto);
    return this.escalationConfigRepository.save(config);
  }

  async findAll(): Promise<AlertEscalationConfig[]> {
    return this.escalationConfigRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<AlertEscalationConfig> {
    const config = await this.escalationConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`升级配置 ${id} 不存在`);
    }
    return config;
  }

  async findByAlertType(alertType: AlertType): Promise<AlertEscalationConfig[]> {
    return this.escalationConfigRepository.find({
      where: { alertType, enabled: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findEnabledConfigs(): Promise<AlertEscalationConfig[]> {
    return this.escalationConfigRepository.find({ where: { enabled: true } });
  }

  async findMatchingConfig(alertType: AlertType, shipId?: string, region?: string): Promise<AlertEscalationConfig | null> {
    const configs = await this.escalationConfigRepository.find({
      where: { enabled: true },
      order: { createdAt: 'DESC' },
    });

    let matchedConfig: AlertEscalationConfig | null = null;
    let highestPriority = 0;

    for (const config of configs) {
      let priority = 0;

      if (config.alertType === alertType) {
        priority += 4;
      } else if (!config.alertType) {
        priority += 2;
      } else {
        continue;
      }

      if (config.shipId === shipId) {
        priority += 4;
      } else if (!config.shipId) {
        priority += 2;
      }

      if (config.region === region) {
        priority += 2;
      } else if (!config.region) {
        priority += 1;
      }

      if (priority > highestPriority) {
        highestPriority = priority;
        matchedConfig = config;
      }
    }

    return matchedConfig;
  }

  async update(id: string, updateDto: UpdateAlertEscalationConfigDto): Promise<AlertEscalationConfig> {
    const config = await this.findById(id);
    Object.assign(config, updateDto);
    return this.escalationConfigRepository.save(config);
  }

  async delete(id: string): Promise<void> {
    const config = await this.findById(id);
    await this.escalationConfigRepository.remove(config);
  }

  async toggleStatus(id: string): Promise<AlertEscalationConfig> {
    const config = await this.findById(id);
    config.enabled = !config.enabled;
    return this.escalationConfigRepository.save(config);
  }
}
