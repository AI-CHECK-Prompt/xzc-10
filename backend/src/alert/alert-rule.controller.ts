import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AlertRuleService } from './alert-rule.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto } from './alert-rule.dto';
import { AlertRule } from './alert-rule.entity';

@Controller('alert-rules')
export class AlertRuleController {
  constructor(private readonly alertRuleService: AlertRuleService) {}

  @Post()
  create(@Body() createAlertRuleDto: CreateAlertRuleDto): Promise<AlertRule> {
    return this.alertRuleService.create(createAlertRuleDto);
  }

  @Get()
  findAll(): Promise<AlertRule[]> {
    return this.alertRuleService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<AlertRule> {
    return this.alertRuleService.findById(id);
  }

  @Get('ship/:shipId')
  findByShipId(@Param('shipId') shipId: string): Promise<AlertRule[]> {
    return this.alertRuleService.findByShipId(shipId);
  }

  @Get('route/:routeId')
  findByRouteId(@Param('routeId') routeId: string): Promise<AlertRule[]> {
    return this.alertRuleService.findByRouteId(routeId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAlertRuleDto: UpdateAlertRuleDto,
  ): Promise<AlertRule> {
    return this.alertRuleService.update(id, updateAlertRuleDto);
  }

  @Put(':id/toggle')
  toggleStatus(@Param('id') id: string): Promise<AlertRule> {
    return this.alertRuleService.toggleStatus(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.alertRuleService.delete(id);
  }

  @Get('enabled/all')
  getEnabledRules(): Promise<AlertRule[]> {
    return this.alertRuleService.getEnabledRules();
  }
}
