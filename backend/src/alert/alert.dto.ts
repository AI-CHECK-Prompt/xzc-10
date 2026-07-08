import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { AlertLevel, AlertStatus, AlertType } from './alert.entity';

export class CreateAlertDto {
  @IsOptional()
  @IsEnum(['deviation', 'speed', 'course', 'eta', 'custom'])
  type?: AlertType;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  level?: AlertLevel;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsNotEmpty()
  @IsString()
  shipId: string;

  @IsOptional()
  @IsString()
  shipName?: string;

  @IsOptional()
  @IsString()
  shipCode?: string;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  routeName?: string;

  @IsOptional()
  @IsNumber()
  deviationDistance?: number;

  @IsOptional()
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  ruleId?: string;
}

export class UpdateAlertDto {
  @IsOptional()
  @IsEnum(['active', 'acknowledged', 'resolved'])
  status?: AlertStatus;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  acknowledgedBy?: string;

  @IsOptional()
  @IsString()
  resolvedBy?: string;

  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
