import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AlertLevel, AlertType } from './alert.entity';

export class EscalationLevelDto {
  @IsNotEmpty()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  level: AlertLevel;

  @IsNotEmpty()
  @IsNumber()
  waitMinutes: number;

  @IsNotEmpty()
  notifyTargets: string[];
}

export class CreateAlertEscalationConfigDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['deviation', 'speed', 'course', 'eta', 'custom'])
  alertType?: AlertType;

  @IsOptional()
  @IsString()
  shipId?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EscalationLevelDto)
  levels: EscalationLevelDto[];

  @IsOptional()
  @IsNumber()
  repeatAlertWindowMinutes?: number;

  @IsOptional()
  @IsNumber()
  notificationIntervalMinutes?: number;

  @IsOptional()
  @IsNumber()
  maxEscalationDurationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateAlertEscalationConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['deviation', 'speed', 'course', 'eta', 'custom'])
  alertType?: AlertType;

  @IsOptional()
  @IsString()
  shipId?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EscalationLevelDto)
  levels?: EscalationLevelDto[];

  @IsOptional()
  @IsNumber()
  repeatAlertWindowMinutes?: number;

  @IsOptional()
  @IsNumber()
  notificationIntervalMinutes?: number;

  @IsOptional()
  @IsNumber()
  maxEscalationDurationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
