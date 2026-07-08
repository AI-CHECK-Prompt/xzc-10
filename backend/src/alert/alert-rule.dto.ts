import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { AlertLevel } from './alert-rule.entity';

export class CreateAlertRuleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  deviationThreshold?: number;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  level?: AlertLevel;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnCreation?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnUpdate?: boolean;

  @IsOptional()
  @IsString()
  shipId?: string;

  @IsOptional()
  @IsString()
  routeId?: string;
}

export class UpdateAlertRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  deviationThreshold?: number;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  level?: AlertLevel;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnCreation?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnUpdate?: boolean;

  @IsOptional()
  @IsString()
  shipId?: string;

  @IsOptional()
  @IsString()
  routeId?: string;
}
