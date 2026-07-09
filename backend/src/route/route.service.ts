import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection } from 'typeorm';
import { Route } from './route.entity';
import { CreateRouteDto, UpdateRouteDto } from './route.dto';
import { ShipService } from '../ship/ship.service';
import { AlertService } from '../alert/alert.service';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    private shipService: ShipService,
    private alertService: AlertService,
  ) {}

  async findAll(): Promise<Route[]> {
    return this.routeRepository.find({ relations: { ship: true } });
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: { ship: true },
    });
    if (!route) {
      throw new NotFoundException(`航线 ${id} 不存在`);
    }
    return route;
  }

  async findByCode(routeCode: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { routeCode },
      relations: { ship: true },
    });
    if (!route) {
      throw new NotFoundException(`航线编码 ${routeCode} 不存在`);
    }
    return route;
  }

  async findByShipId(shipId: string): Promise<Route[]> {
    return this.routeRepository.find({
      where: { shipId },
      relations: { ship: true },
    });
  }

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    const existingRoute = await this.routeRepository.findOne({
      where: { routeCode: createRouteDto.routeCode },
    });
    if (existingRoute) {
      throw new ConflictException(`航线编码 ${createRouteDto.routeCode} 已存在`);
    }

    await this.shipService.findOne(createRouteDto.shipId);

    const route = this.routeRepository.create(createRouteDto);
    return this.routeRepository.save(route);
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const route = await this.findOne(id);

    if (updateRouteDto.routeCode && updateRouteDto.routeCode !== route.routeCode) {
      const existingRoute = await this.routeRepository.findOne({
        where: { routeCode: updateRouteDto.routeCode },
      });
      if (existingRoute) {
        throw new ConflictException(`航线编码 ${updateRouteDto.routeCode} 已存在`);
      }
    }

    if (updateRouteDto.shipId && updateRouteDto.shipId !== route.shipId) {
      await this.shipService.findOne(updateRouteDto.shipId);
    }

    Object.assign(route, updateRouteDto);
    return this.routeRepository.save(route);
  }

  async delete(id: string): Promise<void> {
    const route = await this.findOne(id);

    await getConnection().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.update(
        'alerts',
        { routeId: id, status: ['active', 'acknowledged'] },
        {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: 'system',
          resolutionNote: '关联航线已删除，告警自动关闭',
        },
      );

      await transactionalEntityManager.remove(route);
    });
  }
}
