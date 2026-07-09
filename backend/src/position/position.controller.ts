import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PositionService } from './position.service';
import { ShipPositionDto } from './position.dto';

@Controller('positions')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post()
  updatePosition(@Body() shipPositionDto: ShipPositionDto): Promise<void> {
    return this.positionService.updatePosition(shipPositionDto);
  }

  @Get()
  getAllPositions(): Promise<any[]> {
    return this.positionService.getAllPositions();
  }

  @Get('deviation/all')
  getAllDeviations(): Promise<any[]> {
    return this.positionService.getAllDeviations();
  }

  @Get(':shipId')
  getPosition(@Param('shipId') shipId: string): Promise<any> {
    return this.positionService.getPosition(shipId);
  }

  @Get(':shipId/history')
  getPositionHistory(@Param('shipId') shipId: string): Promise<any[]> {
    return this.positionService.getPositionHistory(shipId);
  }

  @Get(':shipId/deviation')
  getDeviation(@Param('shipId') shipId: string): Promise<any> {
    return this.positionService.getDeviation(shipId);
  }
}
