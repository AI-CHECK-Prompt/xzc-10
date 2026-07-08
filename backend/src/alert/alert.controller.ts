import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto, UpdateAlertDto } from './alert.dto';
import { Alert } from './alert.entity';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  create(@Body() createAlertDto: CreateAlertDto): Promise<Alert> {
    return this.alertService.create(createAlertDto);
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
}
