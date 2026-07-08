import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ship } from '../ship/ship.entity';
import { Route } from '../route/route.entity';
import { AlertModule } from '../alert/alert.module';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ship, Route]), AlertModule],
  providers: [PositionService],
  controllers: [PositionController],
})
export class PositionModule {}
