import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AlertEscalationService } from './alert-escalation.service';

@Injectable()
export class AlertEscalationScheduler {
  private readonly logger = new Logger(AlertEscalationScheduler.name);

  constructor(private readonly escalationService: AlertEscalationService) {}

  @Cron('*/10 * * * *')
  async handleEscalationCheck() {
    this.logger.debug('[告警升级调度] 开始执行告警升级检查');
    try {
      await this.escalationService.checkAndEscalate();
      this.logger.debug('[告警升级调度] 告警升级检查执行完成');
    } catch (error) {
      this.logger.error(`[告警升级调度] 告警升级检查失败: ${error.message}`, error.stack);
    }
  }
}
