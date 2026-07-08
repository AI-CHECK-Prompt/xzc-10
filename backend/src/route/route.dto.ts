import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WaypointDto {
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsNumber()
  order: number;
}

export class CreateRouteDto {
  @IsNotEmpty()
  @IsString()
  routeCode: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  shipId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaypointDto)
  waypoints: WaypointDto[];

  @IsOptional()
  @IsString()
  startPort: string;

  @IsOptional()
  @IsString()
  endPort: string;

  @IsOptional()
  @IsNumber()
  totalDistance: number;

  @IsOptional()
  @IsString()
  estimatedTime: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  description: string;
}

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  routeCode?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  shipId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaypointDto)
  waypoints?: WaypointDto[];

  @IsOptional()
  @IsString()
  startPort?: string;

  @IsOptional()
  @IsString()
  endPort?: string;

  @IsOptional()
  @IsNumber()
  totalDistance?: number;

  @IsOptional()
  @IsString()
  estimatedTime?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
