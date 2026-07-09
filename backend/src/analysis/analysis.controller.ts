import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('dashboard')
  getOverallDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analysisService.getOverallDashboard(startDate, endDate);
  }

  @Get('routes/summary')
  getRouteExecutionSummary() {
    return this.analysisService.getRouteExecutionSummary();
  }

  @Get('routes/:routeId')
  getRouteDetailAnalysis(@Param('routeId') routeId: string) {
    return this.analysisService.getRouteDetailAnalysis(routeId);
  }

  @Get('ships/:shipId')
  getShipAnalysis(@Param('shipId') shipId: string) {
    return this.analysisService.getShipAnalysis(shipId);
  }

  @Get('deviation/stats')
  getDeviationStatistics() {
    return this.analysisService.getDeviationStatistics();
  }

  @Get('alerts/trend')
  getAlertTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analysisService.getAlertTrend(startDate, endDate);
  }
}
