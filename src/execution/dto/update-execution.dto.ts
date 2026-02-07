import { IsEnum, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExecutionStatus } from '../entities/execution.entity';

class PartUsedDto {
  @ApiProperty()
  @IsString()
  partId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  quantity: number;
}

class ServicePerformedDto {
  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  duration: number;
}

export class UpdateExecutionDto {
  @ApiProperty({ enum: ExecutionStatus, required: false })
  @IsEnum(ExecutionStatus)
  @IsOptional()
  status?: ExecutionStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  diagnosisNotes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  repairNotes?: string;

  @ApiProperty({ type: [PartUsedDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartUsedDto)
  @IsOptional()
  partsUsed?: PartUsedDto[];

  @ApiProperty({ type: [ServicePerformedDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePerformedDto)
  @IsOptional()
  servicesPerformed?: ServicePerformedDto[];
}
