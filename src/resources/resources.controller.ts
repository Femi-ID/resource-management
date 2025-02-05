import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Resource } from './schemas/resource.schema';
import { Model } from 'mongoose';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { periodFilter, ResourceType, WaterCategory } from './enums';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DashboardFilterDto } from './dto/dashboard-data.dto';
import { ObjectId } from 'mongoose';
import { ResourceFilterDto } from './dto/resource-filter.dto';
import { ResourceInfoDto, UpdateResourceInfoDto } from './dto/resource-info.dto';

@Controller('v1/resources')
export class ResourcesController {
  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,
    private resourceService: ResourcesService,
  ) {}

  @ApiCreatedResponse({ type: CreateResourceDto })
  @Post('create')
  async createResource(@Body() createResourceDto: CreateResourceDto) {
    return this.resourceService.createResource(createResourceDto);
  }

  @ApiOkResponse({
    description:
      'Response- returns all resources information with the total and average consumption. (filter: period, resourceType)',
  }) /*response of the function here */
  @Get('retrieve-all/:userId')
  async retrieveResources(
    @Param('userId') userId: string,
    // @Query('period') period?: periodFilter,
    // @Query('trackerType') trackerType?: ResourceType,
    // @Query('waterCategory') waterCategory?: WaterCategory,
    @Query() queryFilterDto?: ResourceFilterDto,
  ) {
    return this.resourceService.getResourcesByPeriod(userId, queryFilterDto);
  }

  @ApiOkResponse({
    description:
      'Response- returns an individual resource information with the total and average consumption.',
  })
  @Get('get/:resourceId/:userId')
  async getResource(
    @Param('resourceId') resourceId: ObjectId,
    @Param('userId') userId: ObjectId,
  ) {
    return this.resourceService.getSingleResource({ userId, resourceId });
  }

  @ApiOkResponse({
    description:
      'Response- returns the updated individual resource information.',
  })
  @Put('update/:resourceId/')
  async updateResource(
    // @Param('userId') userId?: string,
    @Param('resourceId') resourceId: ObjectId,
    @Body() updateResourceInfoDto: UpdateResourceInfoDto,
  ) {
    return this.resourceService.updateResource(
      resourceId,
      updateResourceInfoDto,
    );
  }

  @Delete('delete/:resourceId/user/:userId')
  async deleteResource(
    @Param('resourceId') resourceId: string,
    @Param('userId') userId: string,
    // @Param() deleteResource: ResourceInfoDto,
  ) {
    return this.resourceService.deleteResource(userId, resourceId);
  }

  // @ApiOkResponse({
  //   description:
  //     'Response- the total and average resource consumption over a specified period',
  // })
  // @Get('summary/:userId')
  // async getResourcesSummary(
  //   @Query('period') period: periodFilter,
  //   @Param('userId') userId: string,
  // ) {
  //   return this.resourceService.calculateTotalsAndAverages(userId, period);
  // }

  @ApiOkResponse({
    description:
      'Response- the data (bar/pie chart) representing the resource consumption over a specific period',
  })
  @Get('dashboard-data/:userId')
  async getDashboardData(
    @Param('userId') userId: ObjectId,
    @Query() dashboardFilter: DashboardFilterDto,
  ) {
    return this.resourceService.generateDashboardData(userId, dashboardFilter);
  }
}
