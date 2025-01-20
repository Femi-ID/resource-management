import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Resource, ResourceSchema } from './schemas/resource.schema';
import { User, UserSchema } from 'src/auth/schemas/auth.schema';

@Module({
  providers: [ResourcesService],
  controllers: [ResourcesController],
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
})
export class ResourcesModule {}
