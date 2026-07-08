import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateShipDto {
  @IsNotEmpty()
  @IsString()
  shipCode: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  imoNumber: string;

  @IsOptional()
  @IsString()
  mmsi: string;

  @IsOptional()
  @IsString()
  callSign: string;

  @IsOptional()
  @IsString()
  flag: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  length: number;

  @IsOptional()
  @IsNumber()
  width: number;

  @IsOptional()
  @IsNumber()
  draft: number;

  @IsOptional()
  @IsNumber()
  tonnage: number;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  description: string;
}

export class UpdateShipDto {
  @IsOptional()
  @IsString()
  shipCode?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  imoNumber?: string;

  @IsOptional()
  @IsString()
  mmsi?: string;

  @IsOptional()
  @IsString()
  callSign?: string;

  @IsOptional()
  @IsString()
  flag?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  draft?: number;

  @IsOptional()
  @IsNumber()
  tonnage?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ShipResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  shipCode: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  imoNumber: string;

  @IsOptional()
  @IsString()
  mmsi: string;

  @IsOptional()
  @IsString()
  callSign: string;

  @IsOptional()
  @IsString()
  flag: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  length: number;

  @IsOptional()
  @IsNumber()
  width: number;

  @IsOptional()
  @IsNumber()
  draft: number;

  @IsOptional()
  @IsNumber()
  tonnage: number;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  description: string;

  createdAt: Date;
  updatedAt: Date;
}
