import { ApiProperty } from '@nestjs/swagger';
import { periodFilter, ResourceType, WaterCategory } from '../enums';
import { IsEnum, IsOptional } from 'class-validator';

export class ResourceFilterDto {
  @ApiProperty({ required: false })
  @IsEnum(periodFilter, {
    message: 'value must be one of the choices listed in periodFilter.',
  })
  @IsOptional()
  period?: periodFilter;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(WaterCategory, {
    message: 'value must be one of the choices listed in WaterCategory.',
  })
  waterCategory?: WaterCategory;

  @ApiProperty({ required: false })
  @IsEnum(ResourceType, {
    message: 'value must be one of the choices listed in ResourceType.',
  })
  @IsOptional()
  trackerType?: ResourceType;
}
