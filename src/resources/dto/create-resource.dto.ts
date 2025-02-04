import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ResourceType, WaterCategory } from '../enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ required: true })
  @IsEnum(ResourceType, {
    message: 'value must be one of the choices listed in ResourceType.',
  })
  @IsNotEmpty()
  resourceType: ResourceType;

  @ApiProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ required: false })
  @IsEnum(WaterCategory, {
    message: 'value must be one of the choices listed in WaterCategory.',
  })
  @IsOptional()
  waterCategory: WaterCategory;

  @ApiProperty({
    required: false,
    example:
      '2025-01-23 or 2025-01-23T14:30:00Z: Represents 23rd January 2025, 14:30 UTC.',
  })
  @IsOptional()
  @IsDateString()
  customDate: string;
}
