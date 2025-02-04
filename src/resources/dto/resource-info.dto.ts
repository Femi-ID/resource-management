import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Date, ObjectId } from 'mongoose';
import { ResourceType, WaterCategory } from '../enums';

export class ResourceInfoDto {
  @ApiProperty({ required: true })
  @IsMongoId()
  @IsNotEmptyObject()
  userId: ObjectId;

  @ApiProperty({ required: true })
  @IsMongoId()
  @IsNotEmpty()
  resourceId: ObjectId;
}

export class UpdateResourceInfoDto {
  @ApiProperty({ required: true })
  @IsMongoId()
  @IsNotEmptyObject()
  resourceId: ObjectId;

  @ApiProperty({ required: false })
  @IsEnum(ResourceType, {
    message: 'value must be one of the choices listed in ResourceType.',
  })
  @IsOptional()
  resourceType?: ResourceType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ResourceType, {
    message: 'value must be one of the choices listed in WaterCategory.',
  })
  waterCategory?: WaterCategory;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  customDate?: string;
}
