import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertRule } from './alert-rule.entity';
import { Alert } from './alert.entity';
import { AlertEscalationConfig } from './alert-escalation-config.entity';
import { AlertEscalationRecord } from './alert-escalation-record.entity';
import { AlertRuleService } from './alert-rule.service';
import { AlertService } from './alert.service';
import { AlertEscalationConfigService } from './alert-escalation-config.service';
import { AlertEscalationService } from './alert-escalation.service';
import { AlertEscalationScheduler } from './alert-escalation.scheduler';
import { AlertRuleController } from './alert-rule.controller';
import { AlertController } from './alert.controller';
import { AlertEscalationConfigController } from './alert-escalation-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AlertRule, Alert, AlertEscalationConfig, AlertEscalationRecord])],
  providers: [AlertRuleService, AlertService, AlertEscalationConfigService, AlertEscalationService, AlertEscalationScheduler],
  controllers: [AlertRuleController, AlertController, AlertEscalationConfigController],
  exports: [AlertRuleService, AlertService, AlertEscalationConfigService, AlertEscalationService],
})
export class AlertModule {}
