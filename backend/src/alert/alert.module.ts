import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertRule } from './alert-rule.entity';
import { Alert } from './alert.entity';
import { AlertRuleService } from './alert-rule.service';
import { AlertService } from './alert.service';
import { AlertRuleController } from './alert-rule.controller';
import { AlertController } from './alert.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AlertRule, Alert])],
  providers: [AlertRuleService, AlertService],
  controllers: [AlertRuleController, AlertController],
  exports: [AlertRuleService, AlertService],
})
export class AlertModule {}
