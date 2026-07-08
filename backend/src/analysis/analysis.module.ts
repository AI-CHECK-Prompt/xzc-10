import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from '../route/route.entity';
import { Ship } from '../ship/ship.entity';
import { Alert } from '../alert/alert.entity';
import { PositionModule } from '../position/position.module';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Route, Ship, Alert]), PositionModule],
  providers: [AnalysisService],
  controllers: [AnalysisController],
})
export class AnalysisModule {}
