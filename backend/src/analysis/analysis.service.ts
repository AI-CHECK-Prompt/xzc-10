import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../route/route.entity';
import { Ship } from '../ship/ship.entity';
import { Alert } from '../alert/alert.entity';
import { PositionService } from '../position/position.service';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    @InjectRepository(Ship)
    private shipRepository: Repository<Ship>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    private positionService: PositionService,
  ) {}

  async getRouteExecutionSummary(): Promise<{
    totalRoutes: number;
    activeRoutes: number;
    completedRoutes: number;
    inProgressRoutes: number;
    avgCompletionRate: number;
    totalAlerts: number;
    activeAlerts: number;
  }> {
    const totalRoutes = await this.routeRepository.count();
    const activeRoutes = await this.routeRepository.count({ where: { status: 'active' } });
    const completedRoutes = await this.routeRepository.count({ where: { status: 'completed' } });
    const inProgressRoutes = await this.routeRepository.count({ where: { status: 'in_progress' } });

    const totalAlerts = await this.alertRepository.count();
    const activeAlerts = await this.alertRepository.count({ where: { status: 'active' } });

    const avgCompletionRate = await this.calculateAverageCompletionRate();

    return {
      totalRoutes,
      activeRoutes,
      completedRoutes,
      inProgressRoutes,
      avgCompletionRate,
      totalAlerts,
      activeAlerts,
    };
  }

  private async calculateAverageCompletionRate(): Promise<number> {
    const routes = await this.routeRepository.find({ where: { status: 'active' } });
    if (routes.length === 0) return 0;

    let totalRate = 0;
    for (const route of routes) {
      const rate = await this.calculateRouteCompletionRate(route);
      totalRate += rate;
    }

    return Math.round((totalRate / routes.length) * 100) / 100;
  }

  private async calculateRouteCompletionRate(route: Route): Promise<number> {
    const position = await this.positionService.getPosition(route.shipId);
    if (!position) return 0;

    const sortedWaypoints = [...route.waypoints].sort((a, b) => a.order - b.order);
    if (sortedWaypoints.length < 2) return 0;

    const startPoint = sortedWaypoints[0];
    const endPoint = sortedWaypoints[sortedWaypoints.length - 1];
    const currentLat = position.latitude;
    const currentLng = position.longitude;

    const totalDistance = this.calculateDistance(
      startPoint.latitude,
      startPoint.longitude,
      endPoint.latitude,
      endPoint.longitude,
    );

    const distanceFromStart = this.calculateDistance(
      startPoint.latitude,
      startPoint.longitude,
      currentLat,
      currentLng,
    );

    return Math.min((distanceFromStart / totalDistance) * 100, 100);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getRouteDetailAnalysis(routeId: string): Promise<any> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: { ship: true },
    });

    if (!route) {
      return null;
    }

    const position = await this.positionService.getPosition(route.shipId);
    const deviation = await this.positionService.getDeviation(route.shipId);
    const alerts = await this.alertRepository.find({ where: { routeId } });
    const completionRate = await this.calculateRouteCompletionRate(route);

    return {
      route,
      currentPosition: position,
      deviation,
      alerts,
      completionRate,
      alertCount: alerts.length,
      activeAlertCount: alerts.filter((a) => a.status === 'active').length,
    };
  }

  async getShipAnalysis(shipId: string): Promise<any> {
    const ship = await this.shipRepository.findOne({ where: { id: shipId } });
    if (!ship) return null;

    const position = await this.positionService.getPosition(shipId);
    const deviation = await this.positionService.getDeviation(shipId);
    const alerts = await this.alertRepository.find({ where: { shipId } });
    const routes = await this.routeRepository.find({ where: { shipId } });

    let totalDeviation = 0;
    let maxDeviation = 0;
    for (const route of routes) {
      const routeDeviation = await this.positionService.getDeviation(route.shipId);
      totalDeviation += routeDeviation.deviation;
      if (routeDeviation.deviation > maxDeviation) {
        maxDeviation = routeDeviation.deviation;
      }
    }

    return {
      ship,
      currentPosition: position,
      deviation,
      alerts,
      routes,
      routeCount: routes.length,
      alertCount: alerts.length,
      activeAlertCount: alerts.filter((a) => a.status === 'active').length,
      avgDeviation: routes.length > 0 ? totalDeviation / routes.length : 0,
      maxDeviation,
    };
  }

  async getDeviationStatistics(): Promise<{
    ships: {
      shipId: string;
      shipName: string;
      shipCode: string;
      currentDeviation: number;
      avgDeviation: number;
      maxDeviation: number;
      hasActiveAlert: boolean;
    }[];
    overallAvgDeviation: number;
    maxDeviation: number;
    alertCount: number;
  }> {
    const ships = await this.shipRepository.find();
    const result: any[] = [];

    let totalDeviation = 0;
    let maxDeviation = 0;
    let alertCount = 0;

    for (const ship of ships) {
      const deviation = await this.positionService.getDeviation(ship.id);
      const alerts = await this.alertRepository.find({ where: { shipId: ship.id } });
      const activeAlerts = alerts.filter((a) => a.status === 'active');

      result.push({
        shipId: ship.id,
        shipName: ship.name,
        shipCode: ship.shipCode,
        currentDeviation: deviation.deviation,
        avgDeviation: deviation.deviation,
        maxDeviation: deviation.deviation,
        hasActiveAlert: activeAlerts.length > 0,
      });

      totalDeviation += deviation.deviation;
      if (deviation.deviation > maxDeviation) {
        maxDeviation = deviation.deviation;
      }
      alertCount += activeAlerts.length;
    }

    return {
      ships: result,
      overallAvgDeviation: ships.length > 0 ? totalDeviation / ships.length : 0,
      maxDeviation,
      alertCount,
    };
  }

  async getAlertTrend(startDate?: string, endDate?: string): Promise<{
    dailyData: { date: string; count: number }[];
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
  }> {
    let query = this.alertRepository.createQueryBuilder('alert');

    if (startDate) {
      query = query.where('alert.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query = query.andWhere('alert.createdAt <= :endDate', { endDate });
    }

    const dailyData = await query
      .select("DATE_TRUNC('day', alert.createdAt)::date", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy("DATE_TRUNC('day', alert.createdAt)::date")
      .orderBy('date', 'ASC')
      .getRawMany();

    const totalAlerts = await query.getCount();
    const activeAlerts = await this.alertRepository.count({ where: { status: 'active' } });
    const resolvedAlerts = await this.alertRepository.count({ where: { status: 'resolved' } });

    return {
      dailyData: dailyData.map((item) => ({
        date: item.date,
        count: parseInt(item.count),
      })),
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
    };
  }

  async getOverallDashboard(): Promise<any> {
    const [summary, deviationStats, alertTrend] = await Promise.all([
      this.getRouteExecutionSummary(),
      this.getDeviationStatistics(),
      this.getAlertTrend(),
    ]);

    return {
      summary,
      deviationStats,
      alertTrend,
    };
  }
}
