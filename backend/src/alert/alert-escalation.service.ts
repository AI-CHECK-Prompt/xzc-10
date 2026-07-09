import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Alert } from './alert.entity';
import { AlertEscalationRecord, EscalationAction, EscalationNotificationStatus } from './alert-escalation-record.entity';
import { AlertEscalationConfigService } from './alert-escalation-config.service';
import { AlertEscalationConfig, EscalationLevel } from './alert-escalation-config.entity';
import { AlertLevel } from './alert-rule.entity';

const LEVEL_ORDER: AlertLevel[] = ['low', 'medium', 'high', 'critical'];

@Injectable()
export class AlertEscalationService {
  private readonly logger = new Logger(AlertEscalationService.name);

  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(AlertEscalationRecord)
    private escalationRecordRepository: Repository<AlertEscalationRecord>,
    private configService: AlertEscalationConfigService,
  ) {}

  async initializeEscalation(alert: Alert): Promise<void> {
    const config = await this.configService.findMatchingConfig(alert.type, alert.shipId);
    if (!config) {
      this.logger.debug(`[告警升级] 未找到匹配的升级配置，告警ID: ${alert.id}`);
      return;
    }

    alert.escalationConfigId = config.id;
    alert.initialLevel = alert.level;

    const recentAlert = await this.findRecentAlertInWindow(alert, config);
    if (recentAlert && recentAlert.escalationChainId) {
      alert.escalationChainId = recentAlert.escalationChainId;
      alert.level = recentAlert.level;
      alert.lastEscalationAt = recentAlert.lastEscalationAt;
      alert.lastNotificationAt = recentAlert.lastNotificationAt;
      alert.assigneeId = recentAlert.assigneeId;
      alert.assigneeName = recentAlert.assigneeName;
      this.logger.debug(`[告警升级] 沿用升级链路，告警ID: ${alert.id}, 链路ID: ${alert.escalationChainId}`);
    } else {
      alert.escalationChainId = alert.id;
      this.logger.debug(`[告警升级] 新建升级链路，告警ID: ${alert.id}`);
    }

    await this.alertRepository.save(alert);

    await this.sendInitialNotification(alert, config);
  }

  private async findRecentAlertInWindow(alert: Alert, config: AlertEscalationConfig): Promise<Alert | null> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - config.repeatAlertWindowMinutes);

    return this.alertRepository.findOne({
      where: {
        shipId: alert.shipId,
        type: alert.type,
        status: 'resolved',
        createdAt: MoreThanOrEqual(windowStart),
      },
      order: { createdAt: 'DESC' },
    });
  }

  private async sendInitialNotification(alert: Alert, config: AlertEscalationConfig): Promise<void> {
    const currentLevelConfig = config.levels.find(l => l.level === alert.level);
    if (!currentLevelConfig) {
      return;
    }

    const notificationStatus = currentLevelConfig.notifyTargets.map(target => ({
      target,
      sent: false,
      status: 'pending' as const,
    }));

    const record = this.escalationRecordRepository.create({
      alertId: alert.id,
      fromLevel: alert.level,
      toLevel: alert.level,
      action: 'auto',
      configId: config.id,
      notifiedTargets: currentLevelConfig.notifyTargets,
      notificationStatus,
    });

    await this.escalationRecordRepository.save(record);

    await this.sendNotifications(notificationStatus, alert, currentLevelConfig);
    alert.lastNotificationAt = new Date();
    await this.alertRepository.save(alert);
  }

  async checkAndEscalate(): Promise<void> {
    const activeAlerts = await this.alertRepository.find({
      where: { status: 'active' },
      relations: ['escalationRecords'],
    });

    for (const alert of activeAlerts) {
      if (!alert.escalationConfigId) {
        continue;
      }

      try {
        await this.processAlertEscalation(alert);
      } catch (error) {
        this.logger.error(`[告警升级] 处理告警升级失败，告警ID: ${alert.id}, 错误: ${error.message}`);
      }
    }
  }

  private async processAlertEscalation(alert: Alert): Promise<void> {
    const config = await this.configService.findById(alert.escalationConfigId);
    if (!config || !config.enabled) {
      return;
    }

    const totalDurationMinutes = this.getDurationMinutes(alert.createdAt, new Date());
    if (totalDurationMinutes > config.maxEscalationDurationMinutes) {
      this.logger.debug(`[告警升级] 已超过最大升级时长，告警ID: ${alert.id}`);
      return;
    }

    const sortedLevels = [...config.levels].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
    const currentLevelIndex = LEVEL_ORDER.indexOf(alert.level);

    for (let i = currentLevelIndex + 1; i < sortedLevels.length; i++) {
      const targetLevel = sortedLevels[i];

      const accumulatedWaitMinutes = sortedLevels.slice(0, i + 1).reduce((sum, l) => sum + l.waitMinutes, 0);

      if (totalDurationMinutes >= accumulatedWaitMinutes) {
        await this.escalateAlert(alert, config, targetLevel);
        return;
      }
    }

    await this.checkAndSendPeriodicNotification(alert, config);
  }

  private async escalateAlert(alert: Alert, config: AlertEscalationConfig, targetLevel: EscalationLevel): Promise<void> {
    const previousLevel = alert.level;

    const existingRecord = await this.escalationRecordRepository.findOne({
      where: { alertId: alert.id, toLevel: targetLevel.level },
    });

    if (existingRecord) {
      this.logger.debug(`[告警升级] 已存在该等级的升级记录，跳过重复升级，告警ID: ${alert.id}, 目标等级: ${targetLevel.level}`);
      return;
    }

    alert.level = targetLevel.level;
    alert.lastEscalationAt = new Date();

    const notificationStatus = targetLevel.notifyTargets.map(target => ({
      target,
      sent: false,
      status: 'pending' as const,
    }));

    const record = this.escalationRecordRepository.create({
      alertId: alert.id,
      fromLevel: previousLevel,
      toLevel: targetLevel.level,
      action: 'auto',
      configId: config.id,
      notifiedTargets: targetLevel.notifyTargets,
      notificationStatus,
    });

    await Promise.all([
      this.alertRepository.save(alert),
      this.escalationRecordRepository.save(record),
    ]);

    await this.sendNotifications(notificationStatus, alert, targetLevel);
    alert.lastNotificationAt = new Date();
    await this.alertRepository.save(alert);

    this.logger.log(`[告警升级] 告警已升级，告警ID: ${alert.id}, 从 ${previousLevel} 升级到 ${targetLevel.level}`);
  }

  private async checkAndSendPeriodicNotification(alert: Alert, config: AlertEscalationConfig): Promise<void> {
    if (!alert.lastNotificationAt) {
      return;
    }

    const timeSinceLastNotification = this.getDurationMinutes(alert.lastNotificationAt, new Date());
    if (timeSinceLastNotification >= config.notificationIntervalMinutes) {
      const currentLevelConfig = config.levels.find(l => l.level === alert.level);
      if (currentLevelConfig) {
        const notificationStatus = currentLevelConfig.notifyTargets.map(target => ({
          target,
          sent: false,
          status: 'pending' as const,
        }));

        const record = this.escalationRecordRepository.create({
          alertId: alert.id,
          fromLevel: alert.level,
          toLevel: alert.level,
          action: 'auto',
          configId: config.id,
          notifiedTargets: currentLevelConfig.notifyTargets,
          notificationStatus,
          reason: '周期性通知',
        });

        await this.escalationRecordRepository.save(record);
        await this.sendNotifications(notificationStatus, alert, currentLevelConfig);
        alert.lastNotificationAt = new Date();
        await this.alertRepository.save(alert);

        this.logger.debug(`[告警升级] 发送周期性通知，告警ID: ${alert.id}`);
      }
    }
  }

  private async sendNotifications(notificationStatus: EscalationNotificationStatus[], alert: Alert, levelConfig: EscalationLevel): Promise<void> {
    for (const status of notificationStatus) {
      try {
        await this.sendNotificationToTarget(status.target, alert, levelConfig);
        status.sent = true;
        status.sentAt = new Date();
        status.status = 'sent';
      } catch (error) {
        this.logger.error(`[告警升级] 发送通知失败，目标: ${status.target}, 告警ID: ${alert.id}, 错误: ${error.message}`);
        status.status = 'failed';
      }
    }
  }

  private async sendNotificationToTarget(target: string, alert: Alert, levelConfig: EscalationLevel): Promise<void> {
    this.logger.debug(`[告警升级] 发送通知给 ${target}, 告警ID: ${alert.id}, 等级: ${alert.level}`);
  }

  async manualEscalate(
    alertId: string,
    targetLevel: AlertLevel,
    operatorId?: string,
    operatorName?: string,
    reason?: string,
  ): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
      relations: ['escalationRecords'],
    });

    if (!alert) {
      throw new Error(`告警 ${alertId} 不存在`);
    }

    if (alert.status !== 'active') {
      throw new Error(`告警 ${alertId} 状态为 ${alert.status}，无法升级`);
    }

    const currentLevelIndex = LEVEL_ORDER.indexOf(alert.level);
    const targetLevelIndex = LEVEL_ORDER.indexOf(targetLevel);

    if (targetLevelIndex <= currentLevelIndex) {
      throw new Error(`目标等级 ${targetLevel} 必须高于当前等级 ${alert.level}`);
    }

    if (!alert.escalationConfigId) {
      throw new Error(`告警 ${alertId} 没有关联升级配置`);
    }

    const config = await this.configService.findById(alert.escalationConfigId);
    const existingLevel = config.levels.find(l => l.level === targetLevel);
    if (!existingLevel) {
      throw new Error(`目标等级 ${targetLevel} 不在升级配置中`);
    }

    const existingRecord = await this.escalationRecordRepository.findOne({
      where: { alertId, toLevel: targetLevel },
    });

    if (existingRecord) {
      throw new Error(`告警 ${alertId} 已存在到 ${targetLevel} 的升级记录`);
    }

    const previousLevel = alert.level;
    alert.level = targetLevel;
    alert.lastEscalationAt = new Date();

    const notificationStatus = existingLevel.notifyTargets.map(target => ({
      target,
      sent: false,
      status: 'pending' as const,
    }));

    const record = this.escalationRecordRepository.create({
      alertId,
      fromLevel: previousLevel,
      toLevel: targetLevel,
      action: 'manual',
      operatorId,
      operatorName,
      reason,
      configId: config.id,
      notifiedTargets: existingLevel.notifyTargets,
      notificationStatus,
    });

    await Promise.all([
      this.alertRepository.save(alert),
      this.escalationRecordRepository.save(record),
    ]);

    await this.sendNotifications(notificationStatus, alert, existingLevel);
    alert.lastNotificationAt = new Date();
    await this.alertRepository.save(alert);

    this.logger.log(`[告警升级] 人工升级告警，告警ID: ${alertId}, 从 ${previousLevel} 升级到 ${targetLevel}`);

    return alert;
  }

  async updateAssignee(alertId: string, assigneeId: string, assigneeName: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
      relations: ['escalationRecords'],
    });

    if (!alert) {
      throw new Error(`告警 ${alertId} 不存在`);
    }

    alert.assigneeId = assigneeId;
    alert.assigneeName = assigneeName;

    for (const record of alert.escalationRecords) {
      if (record.notificationStatus) {
        for (const status of record.notificationStatus) {
          if (status.status === 'pending') {
            status.target = assigneeId;
          }
        }
      }
    }

    await this.alertRepository.save(alert);
    await this.escalationRecordRepository.save(alert.escalationRecords);

    this.logger.log(`[告警升级] 更新告警负责人，告警ID: ${alertId}, 新负责人: ${assigneeName}`);

    return alert;
  }

  async getEscalationRecords(alertId: string): Promise<AlertEscalationRecord[]> {
    return this.escalationRecordRepository.find({
      where: { alertId },
      order: { createdAt: 'ASC' },
    });
  }

  private getDurationMinutes(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }
}
