import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Resource } from './schemas/resource.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/auth/schemas/auth.schema';
import { CreateResourceDto } from './dto/create-resource.dto';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { periodFilter, ResourceType } from './enums';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createResource(
    createResourceDto: CreateResourceDto,
  ): Promise<Resource | null> {
    const { userId, resourceType, quantity } = createResourceDto;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException(
        `Only registered users can create a resource, invalid-ID: ${userId}`,
      );
    }

    const newResource = new this.resourceModel({
      userId,
      resourceType,
      quantity,
    });
    return await newResource.save();
  }

  async getResourcesByPeriod(
    userId: string,
    period?: periodFilter,
    trackerType?: ResourceType,
  ) {
    const now = Date();
    let startDate: Date = startOfDay(now),
      endDate: Date = endOfDay(now);

    if (period) {
      switch (period) {
        case periodFilter.DAY:
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case periodFilter.WEEK:
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case periodFilter.MONTH:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case periodFilter.YEAR:
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        default:
          throw new NotFoundException(
            'Only valid period options are: day, week, month, year',
          );
      }
    }
    // let water: string, energy: string;

    if (trackerType) {
      const resources = await this.resourceModel.find({
        userId,
        resourceType: `${trackerType}`,
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const total = resources.reduce(
        (sum, resource) => sum + parseFloat(resource.quantity),
        0,
      );
      const average: number = resources.length ? total / resources.length : 0;
      const formattedAverage = Number(average.toFixed(2));

      return {
        resources: resources,
        totalResources: total,
        avgResources: formattedAverage,
      };
    }

    const resources = await this.resourceModel.find({
      userId,
      resourceType: 'water_tracker',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const total = resources.reduce(
      (sum, resource) => sum + parseFloat(resource.quantity),
      0,
    );
    const average: number = resources.length ? total / resources.length : 0;
    const formattedAverage = Number(average.toFixed(2));

    return {
      resources: resources,
      totalResources: total,
      avgResources: formattedAverage,
    };
    // return resources;
  }

  async calculateTotalsAndAverages(userId: string, period: periodFilter) {
    const resources = await this.getResourcesByPeriod(userId, period);
    // const total = resources['resources'].reduce(
    //   (sum, resource) => sum + parseFloat(resource.quantity),
    //   0,
    // );
    const total = resources['totalResources'];
    const average = resources['avgResources'];
    // const average = resources['resources'].length
    //   ? total / resources['resources'].length
    //   : 0;
    return { total: total, average: average };
  }
}
