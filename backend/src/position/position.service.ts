import { Injectable, NotFoundException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, RedisClientType } from 'redis';
import { Ship } from '../ship/ship.entity';
import { Route } from '../route/route.entity';
import { ShipPositionDto } from './position.dto';
import { AlertRuleService } from '../alert/alert-rule.service';
import { AlertService } from '../alert/alert.service';
import { AlertRule } from '../alert/alert-rule.entity';

@Injectable()
export class PositionService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType;

  constructor(
    @InjectRepository(Ship)
    private shipRepository: Repository<Ship>,
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    private alertRuleService: AlertRuleService,
    private alertService: AlertService,
  ) {
    this.redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    });
  }

  async onModuleInit() {
    await this.redisClient.connect();
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
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

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const λ1 = (lon1 * Math.PI) / 180;
    const λ2 = (lon2 * Math.PI) / 180;
    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    return Math.atan2(y, x);
  }

  private pointToSegmentDistance(
    pointLat: number,
    pointLon: number,
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
  ): number {
    const R = 6371000;
    const d13 = this.calculateDistance(startLat, startLon, pointLat, pointLon);
    const d12 = this.calculateDistance(startLat, startLon, endLat, endLon);

    if (d12 < 1) {
      return d13;
    }

    const θ12 = this.calculateBearing(startLat, startLon, endLat, endLon);
    const θ13 = this.calculateBearing(startLat, startLon, pointLat, pointLon);

    const dxt = Math.asin(Math.sin(d13 / R) * Math.sin(θ13 - θ12)) * R;
    const dat = Math.acos(Math.cos(d13 / R) / Math.cos(dxt / R)) * R;

    if (dat < 0) {
      return d13;
    }

    if (dat > d12) {
      return this.calculateDistance(endLat, endLon, pointLat, pointLon);
    }

    return Math.abs(dxt);
  }

  private calculateDeviationFromRoute(
    latitude: number,
    longitude: number,
    waypoints: { latitude: number; longitude: number; order?: number }[],
  ): number {
    if (!waypoints || waypoints.length < 2) {
      return 0;
    }

    const sortedWaypoints = [...waypoints].sort((a, b) => (a.order || 0) - (b.order || 0));
    let minDistance = Infinity;

    for (let i = 0; i < sortedWaypoints.length - 1; i++) {
      const wp1 = sortedWaypoints[i];
      const wp2 = sortedWaypoints[i + 1];

      const distance = this.pointToSegmentDistance(
        latitude,
        longitude,
        wp1.latitude,
        wp1.longitude,
        wp2.latitude,
        wp2.longitude,
      );

      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
  }

  private async checkDeviationAndAlert(
    shipId: string,
    shipName: string,
    shipCode: string,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    const routes = await this.routeRepository.find({
      where: { shipId },
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (routes.length === 0) {
      return;
    }

    const route = routes[0];
    const deviation = this.calculateDeviationFromRoute(
      latitude,
      longitude,
      route.waypoints,
    );

    await this.redisClient.set(
      `ship:deviation:${shipId}`,
      JSON.stringify({ deviation, timestamp: new Date().toISOString() }),
    );

    const rules = await this.alertRuleService.getRulesForShip(shipId);

    for (const rule of rules) {
      if (deviation > rule.deviationThreshold) {
        const hasActiveAlert = await this.alertService.hasActiveDeviationAlert(shipId);

        if (!hasActiveAlert) {
          await this.alertService.create({
            type: 'deviation',
            level: rule.level,
            title: `航线偏离告警 - ${shipName}`,
            message: `船舶 ${shipName} (${shipCode}) 偏离航线 ${route.name}，偏离距离: ${deviation.toFixed(1)} 米，超过阈值: ${rule.deviationThreshold} 米`,
            shipId,
            shipName,
            shipCode,
            routeId: route.id,
            routeName: route.name,
            deviationDistance: deviation,
            threshold: rule.deviationThreshold,
            latitude,
            longitude,
            ruleId: rule.id,
          });
        }
      } else {
        const activeAlerts = await this.alertService.findByShipId(shipId);
        for (const alert of activeAlerts) {
          if (alert.type === 'deviation' && alert.status === 'active') {
            await this.alertService.resolve(alert.id, 'system', '船舶已回到航线范围内');
          }
        }
      }
    }
  }

  async updatePosition(shipPositionDto: ShipPositionDto): Promise<void> {
    const ship = await this.shipRepository.findOne({
      where: { id: shipPositionDto.shipId },
    });
    if (!ship) {
      throw new NotFoundException(`船舶 ${shipPositionDto.shipId} 不存在`);
    }

    const positionData = {
      ...shipPositionDto,
      shipName: ship.name,
      shipCode: ship.shipCode,
      timestamp: shipPositionDto.timestamp || new Date().toISOString(),
    };

    await this.redisClient.set(
      `ship:position:${shipPositionDto.shipId}`,
      JSON.stringify(positionData),
    );

    await this.redisClient.lPush(
      `ship:history:${shipPositionDto.shipId}`,
      JSON.stringify(positionData),
    );

    await this.redisClient.lTrim(
      `ship:history:${shipPositionDto.shipId}`,
      0,
      99,
    );

    await this.checkDeviationAndAlert(
      ship.id,
      ship.name,
      ship.shipCode,
      shipPositionDto.latitude,
      shipPositionDto.longitude,
    );
  }

  async getPosition(shipId: string): Promise<any> {
    const positionStr = await this.redisClient.get(`ship:position:${shipId}`);
    if (!positionStr) {
      return null;
    }
    return JSON.parse(positionStr as string);
  }

  async getAllPositions(): Promise<any[]> {
    const keys = await this.redisClient.keys('ship:position:*');
    const positions = [];

    for (const key of keys) {
      const positionStr = await this.redisClient.get(key);
      if (positionStr) {
        positions.push(JSON.parse(positionStr as string));
      }
    }

    return positions;
  }

  async getPositionHistory(shipId: string): Promise<any[]> {
    const historyStr = await this.redisClient.lRange(
      `ship:history:${shipId}`,
      0,
      -1,
    );
    return historyStr.map((item) => JSON.parse(item as string)).reverse();
  }

  async getDeviation(shipId: string): Promise<any> {
    const deviationStr = await this.redisClient.get(`ship:deviation:${shipId}`);
    if (!deviationStr) {
      return { deviation: 0, timestamp: null };
    }
    return JSON.parse(deviationStr as string);
  }

  async getAllDeviations(): Promise<any[]> {
    const keys = await this.redisClient.keys('ship:deviation:*');
    const deviations = [];

    for (const key of keys) {
      const deviationStr = await this.redisClient.get(key);
      if (deviationStr) {
        const shipId = key.replace('ship:deviation:', '');
        deviations.push({
          shipId,
          ...JSON.parse(deviationStr as string),
        });
      }
    }

    return deviations;
  }
}
