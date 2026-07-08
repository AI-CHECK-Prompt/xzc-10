import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ship } from '../ship/ship.entity';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ship])],
  providers: [PositionService],
  controllers: [PositionController],
})
export class PositionModule {}
