import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AlertEscalationConfigService } from './alert-escalation-config.service';
import { CreateAlertEscalationConfigDto, UpdateAlertEscalationConfigDto } from './alert-escalation-config.dto';
import { AlertEscalationConfig } from './alert-escalation-config.entity';

@Controller('alert-escalation-configs')
export class AlertEscalationConfigController {
  constructor(private readonly configService: AlertEscalationConfigService) {}

  @Post()
  create(@Body() createDto: CreateAlertEscalationConfigDto): Promise<AlertEscalationConfig> {
    return this.configService.create(createDto);
  }

  @Get()
  findAll(): Promise<AlertEscalationConfig[]> {
    return this.configService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<AlertEscalationConfig> {
    return this.configService.findById(id);
  }

  @Get('enabled/all')
  findEnabledConfigs(): Promise<AlertEscalationConfig[]> {
    return this.configService.findEnabledConfigs();
  }

  @Get('matching')
  findMatchingConfig(
    @Query('alertType') alertType: string,
    @Query('shipId') shipId?: string,
    @Query('region') region?: string,
  ): Promise<AlertEscalationConfig | null> {
    return this.configService.findMatchingConfig(alertType as any, shipId, region);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAlertEscalationConfigDto,
  ): Promise<AlertEscalationConfig> {
    return this.configService.update(id, updateDto);
  }

  @Put(':id/toggle')
  toggleStatus(@Param('id') id: string): Promise<AlertEscalationConfig> {
    return this.configService.toggleStatus(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.configService.delete(id);
  }
}
