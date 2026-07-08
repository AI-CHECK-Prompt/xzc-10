import { Injectable, NotFoundException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, RedisClientType } from 'redis';
import { Ship } from '../ship/ship.entity';
import { ShipPositionDto } from './position.dto';

@Injectable()
export class PositionService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType;

  constructor(
    @InjectRepository(Ship)
    private shipRepository: Repository<Ship>,
  ) {
    this.redisClient = createClient({
      socket: {
        host: 'localhost',
        port: 6379,
      },
    });
  }

  async onModuleInit() {
    await this.redisClient.connect();
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
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
}
