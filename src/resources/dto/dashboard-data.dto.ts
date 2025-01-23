import { ApiProperty } from '@nestjs/swagger';
import { periodFilter, ResourceType } from '../enums';
import { IsNotEmpty, IsString } from 'class-validator';

export class DashboardFilterDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  period: periodFilter;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  trackerType: ResourceType;
}
