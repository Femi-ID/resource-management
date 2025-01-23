import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Resource } from './schemas/resource.schema';
import { Model, ObjectId } from 'mongoose';
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
import { DashboardFilterDto } from './dto/dashboard-data.dto';

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

    // water total and average
    const waterResources = await this.resourceModel.find({
      userId,
      resourceType: ResourceType.WATER_TRACKER,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const waterTotal = waterResources.reduce(
      (sum, waterResource) => sum + parseFloat(waterResource.quantity),
      0,
    );
    const waterAverage: number = waterResources.length
      ? waterTotal / waterResources.length
      : 0;
    const formattedWaterAverage = Number(waterAverage.toFixed(2));

    // energy total and average
    const energyResources = await this.resourceModel.find({
      userId,
      resourceType: ResourceType.ENERGY_TRACKER,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const energyTotal = energyResources.reduce(
      (sum, waterResource) => sum + parseFloat(waterResource.quantity),
      0,
    );
    const energyAverage: number = energyResources.length
      ? energyTotal / energyResources.length
      : 0;
    const formattedEnergyAverage = Number(energyAverage.toFixed(2));

    return {
      energy: {
        resources: energyResources,
        totalResources: energyTotal,
        avgResources: formattedEnergyAverage,
      },
      water: {
        resources: waterResources,
        totalResources: waterTotal,
        avgResources: formattedWaterAverage,
      },
    };
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

  // async generateDashboardData(userId: ObjectId) {}

  async generateDashboardData(
    userId: string,
    dashboardFilter: DashboardFilterDto,
  ) {
    const { period, trackerType } = dashboardFilter;
    let labels: string[] = [];
    let data: number[] = [];

    const now = new Date();
    const resourceType =
      trackerType === 'water_tracker'
        ? ResourceType.WATER_TRACKER
        : ResourceType.ENERGY_TRACKER;
    console.log(`tracker type: ${trackerType}`);

    if (period === 'day') {
      // Define time intervals for the day (6 hours)
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00 - ${i + 1}:00`);
      data = await Promise.all(
        labels.map(async (_, i) => {
          const startHour = new Date(now.setHours(i, 0, 0, 0));
          const endHour = new Date(now.setHours(i + 1, 0, 0, 0));
          // const endHour = new Date(startOfDay.getTime() + 60 * 60 * 1000 - 1); // End of the hour
          const resources = await this.resourceModel.find({
            userId,
            resourceType,
            createdAt: { $gte: startHour, $lte: endHour },
          });
          console.log(`result: ${resources}`);
          return resources.reduce(
            (sum, resource) => sum + parseFloat(resource.quantity),
            0,
          );
        }),
      );
    } else if (period === 'week') {
      // Days of the week
      labels = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ];
      data = await Promise.all(
        labels.map(async (_, i) => {
          // const startOfWeek = new Date(
          //   now.setDate(now.getDate() - now.getDay() + i + 1),
          // ); // Adjust start date
          // const startOfDay = new Date(startOfWeek.setHours(0, 0, 0, 0));
          // const endOfDay = new Date(startOfDay.setHours(23, 59, 59, 999));

          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + i + 1)); // Adjust for each day
          const startOfDay = new Date(startOfWeek.setHours(0, 0, 0, 0));
          const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
          const resources = await this.resourceModel.find({
            userId,
            resourceType,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          });
          console.log(`result: ${resources}`);
          return resources.reduce(
            (sum, resource) => sum + parseFloat(resource.quantity),
            0,
          );
        }),
      );
    } else if (period === 'month') {
      // Weeks of the month
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      data = await Promise.all(
        labels.map(async (_, i) => {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const startOfWeek = new Date(startOfMonth.setDate(i * 7 + 1));
          // const endOfWeek = new Date(
          //   startOfWeek.setDate(startOfWeek.getDate() + 6),
          // );
          const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
          const resources = await this.resourceModel.find({
            userId,
            resourceType,
            createdAt: { $gte: startOfWeek, $lte: endOfWeek },
          });
          console.log(`result: ${resources}`);
          return resources.reduce(
            (sum, resource) => sum + parseFloat(resource.quantity),
            0,
          );
        }),
      );
    } else if (period === 'year') {
      // Months of the year
      labels = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      data = await Promise.all(
        labels.map(async (_, i) => {
          const startOfYear = new Date(now.getFullYear(), i, 1); // Start of the month
          const endOfMonth = new Date(new Date(startOfYear).setMonth(i + 1, 0)); // End of the month

          const resources = await this.resourceModel.find({
            userId,
            resourceType,
            createdAt: { $gte: startOfYear, $lte: endOfMonth },
          });

          return resources.reduce((sum, resource) => sum + parseFloat(resource.quantity), 0);
        }));
    }

    return {
      type: 'bar', // or 'pie'
      labels,
      datasets: [
        {
          label: `${resourceType} Consumption: period- (${period})`,
          data,
          backgroundColor: labels.map(() => 'rgba(54, 162, 235, 0.2)'),
          borderColor: labels.map(() => 'rgba(54, 162, 235, 1)'),
          borderWidth: 1,
        },
      ],
    };
  }
}
