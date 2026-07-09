import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRule } from './alert-rule.entity';
import { CreateAlertRuleDto, UpdateAlertRuleDto } from './alert-rule.dto';

@Injectable()
export class AlertRuleService {
  constructor(
    @InjectRepository(AlertRule)
    private alertRuleRepository: Repository<AlertRule>,
  ) {}

  async create(createAlertRuleDto: CreateAlertRuleDto): Promise<AlertRule> {
    const alertRule = this.alertRuleRepository.create(createAlertRuleDto);
    return this.alertRuleRepository.save(alertRule);
  }

  async findAll(): Promise<AlertRule[]> {
    return this.alertRuleRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<AlertRule> {
    const alertRule = await this.alertRuleRepository.findOne({ where: { id } });
    if (!alertRule) {
      throw new NotFoundException(`告警规则 ${id} 不存在`);
    }
    return alertRule;
  }

  async findByShipId(shipId: string): Promise<AlertRule[]> {
    return this.alertRuleRepository.find({
      where: { shipId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByRouteId(routeId: string): Promise<AlertRule[]> {
    return this.alertRuleRepository.find({
      where: { routeId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateAlertRuleDto: UpdateAlertRuleDto): Promise<AlertRule> {
    const alertRule = await this.findById(id);
    Object.assign(alertRule, updateAlertRuleDto);
    return this.alertRuleRepository.save(alertRule);
  }

  async delete(id: string): Promise<void> {
    const alertRule = await this.findById(id);
    await this.alertRuleRepository.remove(alertRule);
  }

  async toggleStatus(id: string): Promise<AlertRule> {
    const alertRule = await this.findById(id);
    alertRule.enabled = !alertRule.enabled;
    return this.alertRuleRepository.save(alertRule);
  }

  async getEnabledRules(): Promise<AlertRule[]> {
    return this.alertRuleRepository.find({ where: { enabled: true } });
  }

  async getRulesForShip(shipId: string): Promise<AlertRule[]> {
    const shipSpecificRules = await this.alertRuleRepository.find({
      where: { shipId, enabled: true },
      order: { deviationThreshold: 'ASC' },
    });
    const globalRules = await this.alertRuleRepository.find({
      where: { shipId: null, enabled: true },
      order: { deviationThreshold: 'ASC' },
    });
    return [...shipSpecificRules, ...globalRules];
  }
}
