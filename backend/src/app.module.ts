import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { typeOrmConfig } from './config/typeorm.config';
import { ShipModule } from './ship/ship.module';
import { RouteModule } from './route/route.module';
import { PositionModule } from './position/position.module';
import { AlertModule } from './alert/alert.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    CacheModule.register({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ShipModule,
    RouteModule,
    PositionModule,
    AlertModule,
    AnalysisModule,
  ],
})
export class AppModule {}
