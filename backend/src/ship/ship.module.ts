import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ship } from './ship.entity';
import { ShipService } from './ship.service';
import { ShipController } from './ship.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ship])],
  providers: [ShipService],
  controllers: [ShipController],
  exports: [ShipService],
})
export class ShipModule {}
