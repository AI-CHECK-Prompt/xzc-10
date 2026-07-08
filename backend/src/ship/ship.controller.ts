import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ShipService } from './ship.service';
import { CreateShipDto, UpdateShipDto } from './ship.dto';
import { Ship } from './ship.entity';

@Controller('ships')
export class ShipController {
  constructor(private readonly shipService: ShipService) {}

  @Get()
  findAll(): Promise<Ship[]> {
    return this.shipService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Ship> {
    return this.shipService.findOne(id);
  }

  @Get('code/:shipCode')
  findByCode(@Param('shipCode') shipCode: string): Promise<Ship> {
    return this.shipService.findByCode(shipCode);
  }

  @Post()
  create(@Body() createShipDto: CreateShipDto): Promise<Ship> {
    return this.shipService.create(createShipDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateShipDto: UpdateShipDto): Promise<Ship> {
    return this.shipService.update(id, updateShipDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.shipService.delete(id);
  }
}
