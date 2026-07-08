import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { typeOrmConfig } from './config/typeorm.config';
import { redisConfig } from './config/redis.config';
import { ShipModule } from './ship/ship.module';
import { RouteModule } from './route/route.module';
import { PositionModule } from './position/position.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore(redisConfig),
      }),
      isGlobal: true,
    }),
    ShipModule,
    RouteModule,
    PositionModule,
  ],
})
export class AppModule {}
