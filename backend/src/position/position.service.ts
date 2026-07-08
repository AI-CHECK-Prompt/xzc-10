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
    const d23 = this.calculateDistance(endLat, endLon, pointLat, pointLon);

    if (d12 < 1) {
      return d13;
    }

    const cosAlpha =
      (Math.cos(d23 / R) - Math.cos(d12 / R) * Math.cos(d13 / R)) /
      (Math.sin(d12 / R) * Math.sin(d13 / R));

    const clampedCosAlpha = Math.max(-1, Math.min(1, cosAlpha));
    const alpha = Math.acos(clampedCosAlpha);

    if (alpha > Math.PI / 2) {
      return d13;
    }

    const cosBeta =
      (Math.cos(d13 / R) - Math.cos(d12 / R) * Math.cos(d23 / R)) /
      (Math.sin(d12 / R) * Math.sin(d23 / R));

    const clampedCosBeta = Math.max(-1, Math.min(1, cosBeta));
    const beta = Math.acos(clampedCosBeta);

    if (beta > Math.PI / 2) {
      return d23;
    }

    return R * Math.asin(Math.sin(d13 / R) * Math.sin(alpha));
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
    });

    if (routes.length === 0) {
      return;
    }

    const rules = await this.alertRuleService.getRulesForShip(shipId);

    const activeRouteIds = new Set<string>();

    for (const route of routes) {
      activeRouteIds.add(route.id);

      const deviation = this.calculateDeviationFromRoute(
        latitude,
        longitude,
        route.waypoints,
      );

      await this.redisClient.set(
        `ship:deviation:${shipId}:${route.id}`,
        JSON.stringify({ deviation, routeId: route.id, routeName: route.name, timestamp: new Date().toISOString() }),
      );

      if (rules.length === 0) {
        continue;
      }

      const matchingRule = rules.find(rule => deviation > rule.deviationThreshold);

      if (matchingRule) {
        const hasActiveAlert = await this.alertService.hasActiveDeviationAlert(shipId, route.id);

        if (!hasActiveAlert) {
          await this.alertService.create({
            type: 'deviation',
            level: matchingRule.level,
            title: `航线偏离告警 - ${shipName}`,
            message: `船舶 ${shipName} (${shipCode}) 偏离航线 ${route.name}，偏离距离: ${deviation.toFixed(1)} 米，超过阈值: ${matchingRule.deviationThreshold} 米`,
            shipId,
            shipName,
            shipCode,
            routeId: route.id,
            routeName: route.name,
            deviationDistance: deviation,
            threshold: matchingRule.deviationThreshold,
            latitude,
            longitude,
            ruleId: matchingRule.id,
          });
        }
      } else {
        const activeDeviationAlerts = await this.alertService.findActiveAlertsByShipIdAndRouteIdAndType(shipId, route.id, 'deviation');
        for (const alert of activeDeviationAlerts) {
          await this.alertService.resolve(alert.id, 'system', '船舶已回到航线范围内');
        }
      }
    }

    const allActiveAlerts = await this.alertService.findActiveAlertsByShipIdAndType(shipId, 'deviation');
    for (const alert of allActiveAlerts) {
      if (!activeRouteIds.has(alert.routeId)) {
        await this.alertService.resolve(alert.id, 'system', '航线已失效');
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

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const scanResult = await this.redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = scanResult.cursor;
      keys.push(...scanResult.keys);
    } while (cursor !== '0');

    return keys;
  }

  async getAllPositions(): Promise<any[]> {
    const keys = await this.scanKeys('ship:position:*');
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

  async getDeviation(shipId: string): Promise<any[]> {
    const keys = await this.scanKeys(`ship:deviation:${shipId}:*`);
    const deviations = [];

    for (const key of keys) {
      const deviationStr = await this.redisClient.get(key);
      if (deviationStr) {
        const parts = key.split(':');
        deviations.push({
          shipId,
          routeId: parts[3],
          ...JSON.parse(deviationStr as string),
        });
      }
    }

    return deviations.length > 0 ? deviations : [{ deviation: 0, timestamp: null, routeId: null }];
  }

  async getAllDeviations(): Promise<any[]> {
    const keys = await this.scanKeys('ship:deviation:*');
    const deviations = [];

    for (const key of keys) {
      const deviationStr = await this.redisClient.get(key);
      if (deviationStr) {
        const parts = key.split(':');
        deviations.push({
          shipId: parts[2],
          routeId: parts[3],
          ...JSON.parse(deviationStr as string),
        });
      }
    }

    return deviations;
  }
}
