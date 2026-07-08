import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class ShipPositionDto {
  @IsNotEmpty()
  @IsString()
  shipId: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  speed: number;

  @IsOptional()
  @IsNumber()
  course: number;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsNumber()
  heading: number;

  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class ShipPositionResponseDto extends ShipPositionDto {
  @IsString()
  id: string;

  @IsString()
  shipName: string;

  @IsString()
  shipCode: string;
}
