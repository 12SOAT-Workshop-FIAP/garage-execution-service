import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExecutionDto {
  @ApiProperty({ example: 'work-order-uuid' })
  @IsString()
  @IsNotEmpty()
  workOrderId: string;

  @ApiProperty({ example: 'quote-uuid', required: false })
  @IsString()
  @IsOptional()
  quoteId?: string;

  @ApiProperty({ example: 'technician-uuid' })
  @IsString()
  @IsNotEmpty()
  technicianId: string;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  priority?: number;
}
