import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Date, Document } from 'mongoose';
import { User } from 'src/auth/schemas/auth.schema';
import { ResourceType, WaterCategory } from '../enums';
import { IsEnum } from 'class-validator';

@Schema({ timestamps: true })
export class Resource extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true, enum: ResourceType })
  @IsEnum(ResourceType, {
    message: 'Value must be one of the choices listed in the ResourceType',
  })
  resourceType: ResourceType;

  @Prop({
    required: function () {
      return this.resourceType === ResourceType.WATER_TRACKER;
    },
    enum: WaterCategory,
    default: WaterCategory.GENERAL_PURPOSES,
  })
  @IsEnum(WaterCategory, {
    message: 'Value must be one of the choices listed in the WaterCategory',
  })
  waterCategory?: WaterCategory;

  @Prop({ required: false, default: Date.now(), type: Date })
  customDate: Date;

  @Prop({ required: true })
  quantity: string;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
