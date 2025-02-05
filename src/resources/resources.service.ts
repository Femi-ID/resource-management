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
import { ChartType, periodFilter, ResourceType, WaterCategory } from './enums';
import { DashboardFilterDto } from './dto/dashboard-data.dto';
import { ResourceInfoDto, UpdateResourceInfoDto } from './dto/resource-info.dto';
import { ResourceFilterDto } from './dto/resource-filter.dto';
import { isStringObject } from 'util/types';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createResource(
    createResourceDto: CreateResourceDto,
  ): Promise<Resource | null> {
    const { userId, resourceType, quantity, waterCategory, customDate } = createResourceDto;

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
      waterCategory: waterCategory ?? null, // nullish coalesce
      customDate: customDate ? customDate : null, // ternary operator
    });
    return await newResource.save();
  }

  async getSingleResource(resourceInfoDto: ResourceInfoDto): Promise<Resource> {
    const { userId, resourceId } = resourceInfoDto;
    const resource = await this.resourceModel.findById(resourceId);
    // console.log('resource::', resource);
    if (!resource && resource._id !== userId)
      throw new NotFoundException('Resource for this owner does not exist!!!');
    return resource;
  }

  async updateResource(
    resourceId: ObjectId,
    updatedResourceInfoDto: UpdateResourceInfoDto,
  ) {
    const resourceIdType = isStringObject(resourceId);
    try {
      const resource = await this.resourceModel.findByIdAndUpdate(
        resourceId,
        // updatedResourceInfoDto.userId,
        updatedResourceInfoDto,
        { new: true },
      );
      if (!resource)
        throw new NotFoundException('Resource for this owner does not exist!!');
      return { resource, message: 'resource successfully UPDATED.' };
    } catch (error) {
      console.log(error.message);
      return error.message;
    }
  }

  async deleteResource(userId: string, resourceId: string) {
    // const { userId, resourceId } = resourceInfoDto;
    try {
      const resource = await this.resourceModel.findOne({
        _id: resourceId,
        userId,
      });
      if (!resource)
        throw new NotFoundException('Resource for this owner does not exist!!');
      await this.resourceModel.deleteOne({ _id: resourceId });
      return { resource, message: 'resource successfully DELETED.' };
    } catch (error) {
      console.log(error.message);
      return error.message;
    }
  }

  async getResourcesByPeriod(
    userId: string,
    // period?: periodFilter,
    // trackerType?: ResourceType,
    // waterCategory?: WaterCategory,
    resourceFilterDto: ResourceFilterDto,
  ) {
    const { period, trackerType, waterCategory } = resourceFilterDto;
    console.log('water category', waterCategory);
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
      let resources = await this.resourceModel.find({
        userId,
        resourceType: `${trackerType}`,
        createdAt: { $gte: startDate, $lte: endDate },
        // waterCategory: waterCategory ?? undefined,
        // means where wCategory is undefined, so it return resources without waterCategory
      });
      if (waterCategory) {
        resources = await this.resourceModel.find({
          userId,
          resourceType: `${trackerType}`,
          createdAt: { $gte: startDate, $lte: endDate },
          waterCategory: waterCategory,
        });
      }

      const total = resources.reduce(
        (sum, resource) => sum + parseFloat(resource.quantity),
        0,
      );
      const average: number = resources.length ? total / resources.length : 0;
      const formattedAverage = Number(average.toFixed(2));

      if (trackerType === ResourceType.WATER_TRACKER) {
        return {
          resources: resources,
          totalResources: total + ' litres',
          avgResources: formattedAverage + ' litres',
        };
      }

      return {
        resources: resources,
        totalResources: total + ' kw/hr',
        avgResources: formattedAverage + ' kw/hr',
      };
    }

    // water total and average
    const waterResources = await this.resourceModel.find({
      userId,
      resourceType: ResourceType.WATER_TRACKER,
      createdAt: { $gte: startDate, $lte: endDate },
      waterCategory: waterCategory ?? null,
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
        totalResources: energyTotal + ' kw/hr',
        avgResources: formattedEnergyAverage + ' kw/hr',
      },
      water: {
        resources: waterResources,
        totalResources: waterTotal + ' litres',
        avgResources: formattedWaterAverage + ' litres',
      },
    };
  }

  // async calculateTotalsAndAverages(userId: string, period: periodFilter) {
  //   const resources = await this.getResourcesByPeriod(userId, period);
  //   // const total = resources['resources'].reduce(
  //   //   (sum, resource) => sum + parseFloat(resource.quantity),
  //   //   0,
  //   // );
  //   const total = resources['totalResources'];
  //   const average = resources['avgResources'];
  //   // const average = resources['resources'].length
  //   //   ? total / resources['resources'].length
  //   //   : 0;
  //   return { total: total, average: average };
  // }

  // async generateDashboardData(userId: ObjectId) {}

  async generateDashboardData(
    userId: ObjectId,
    dashboardFilter: DashboardFilterDto,
  ) {
    const { period, trackerType, chartType } = dashboardFilter;
    let labels: string[] = [];
    let data: number[] = [];

    const now = new Date();
    const resourceType =
      trackerType === 'water_tracker'
        ? ResourceType.WATER_TRACKER
        : ResourceType.ENERGY_TRACKER;
    console.log(`tracker type: ${trackerType}`);

    if (chartType === ChartType.BAR) {
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
        labels = ['MOND', 'TUES', 'WED', 'THURS', 'FRI', 'SAT', 'SUN'];
        data = await Promise.all(
          labels.map(async (_, i) => {
            // const endOfDay = new Date(startOfDay.setHours(23, 59, 59, 999));

            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + i + 1)); // Adjust for each day
            const startOfDay = new Date(startOfWeek.setHours(0, 0, 0, 0));
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
            const resources = await this.resourceModel.find({
              userId,
              resourceType,
              createdAt: { $gte: startOfDay, $lte: endOfDay },
            });
            // console.log(`result: ${resources}`);
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
            // console.log(`result: ${resources}`);
            return resources.reduce(
              (sum, resource) => sum + parseFloat(resource.quantity),
              0,
            );
          }),
        );
      } else if (period === 'year') {
        // Months of the year
        labels = [
          'JAN',
          'FEB',
          'MAR',
          'APR',
          'MAY',
          'JUN',
          'JUL',
          'AUG',
          'SEP',
          'OCT',
          'NOV',
          'DEC',
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
          }),
        );
      }
    } else if (
      chartType === ChartType.PIE &&
      trackerType === ResourceType.WATER_TRACKER
    ) {
      // Pie chart logic for water_tracker
      labels = Object.values(WaterCategory);
      data = await Promise.all(
        labels.map(async (waterCategory) => {
          const resources = await this.resourceModel.find({
            userId,
            resourceType: trackerType,
            waterCategory: waterCategory,
            createdAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) },
          });
          // console.log(`resources: ${resources}`);

          return resources.reduce((sum, resource) => sum + parseFloat(resource.quantity), 0);
        }),
      );
    }

    return {
      type: chartType, // bar or pie
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
