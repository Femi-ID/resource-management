import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ResourceType } from '../enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ required: true })
  @IsEnum(ResourceType, {
    message: 'value must be one of the choices listed in DeliveryMethod.',
  })
  @IsNotEmpty()
  resourceType: ResourceType;

  @ApiProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
