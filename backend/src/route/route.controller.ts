import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { RouteService } from './route.service';
import { CreateRouteDto, UpdateRouteDto } from './route.dto';
import { Route } from './route.entity';

@Controller('routes')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Get()
  findAll(): Promise<Route[]> {
    return this.routeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Route> {
    return this.routeService.findOne(id);
  }

  @Get('code/:routeCode')
  findByCode(@Param('routeCode') routeCode: string): Promise<Route> {
    return this.routeService.findByCode(routeCode);
  }

  @Get('ship/:shipId')
  findByShipId(@Param('shipId') shipId: string): Promise<Route[]> {
    return this.routeService.findByShipId(shipId);
  }

  @Post()
  create(@Body() createRouteDto: CreateRouteDto): Promise<Route> {
    return this.routeService.create(createRouteDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto): Promise<Route> {
    return this.routeService.update(id, updateRouteDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.routeService.delete(id);
  }
}
