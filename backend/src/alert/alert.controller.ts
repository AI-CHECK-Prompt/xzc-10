import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertEscalationService } from './alert-escalation.service';
import { CreateAlertDto, UpdateAlertDto } from './alert.dto';
import { Alert } from './alert.entity';
import { AlertEscalationRecord } from './alert-escalation-record.entity';
import { AlertLevel } from './alert-rule.entity';

@Controller('alerts')
export class AlertController {
  constructor(
    private readonly alertService: AlertService,
    private readonly escalationService: AlertEscalationService,
  ) {}

  @Post()
  async create(@Body() createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = await this.alertService.create(createAlertDto);
    await this.escalationService.initializeEscalation(alert);
    return alert;
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('level') level?: string): Promise<Alert[]> {
    if (status) {
      return this.alertService.findByStatus(status);
    }
    if (level) {
      return this.alertService.findByLevel(level);
    }
    return this.alertService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Alert> {
    return this.alertService.findById(id);
  }

  @Get('ship/:shipId')
  findByShipId(@Param('shipId') shipId: string): Promise<Alert[]> {
    return this.alertService.findByShipId(shipId);
  }

  @Get('active/all')
  findActiveAlerts(): Promise<Alert[]> {
    return this.alertService.findActiveAlerts();
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
  ): Promise<Alert> {
    return this.alertService.update(id, updateAlertDto);
  }

  @Put(':id/acknowledge')
  acknowledge(
    @Param('id') id: string,
    @Body() body: { acknowledgedBy?: string },
  ): Promise<Alert> {
    return this.alertService.acknowledge(id, body.acknowledgedBy);
  }

  @Put(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() body: { resolvedBy?: string; resolutionNote?: string },
  ): Promise<Alert> {
    return this.alertService.resolve(id, body.resolvedBy, body.resolutionNote);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.alertService.delete(id);
  }

  @Get('stats/all')
  getAlertStats() {
    return this.alertService.getAlertStats();
  }

  @Put(':id/escalate')
  async escalate(
    @Param('id') id: string,
    @Body() body: { level: string; operatorId?: string; operatorName?: string; reason?: string },
  ): Promise<Alert> {
    const validLevels: AlertLevel[] = ['low', 'medium', 'high', 'critical'];
    if (!validLevels.includes(body.level as AlertLevel)) {
      throw new BadRequestException(`无效的告警等级: ${body.level}`);
    }
    return this.escalationService.manualEscalate(id, body.level as AlertLevel, body.operatorId, body.operatorName, body.reason);
  }

  @Put(':id/assignee')
  async updateAssignee(
    @Param('id') id: string,
    @Body() body: { assigneeId: string; assigneeName: string },
  ): Promise<Alert> {
    return this.escalationService.updateAssignee(id, body.assigneeId, body.assigneeName);
  }

  @Get(':id/escalation-records')
  getEscalationRecords(@Param('id') id: string): Promise<AlertEscalationRecord[]> {
    return this.escalationService.getEscalationRecords(id);
  }
}
