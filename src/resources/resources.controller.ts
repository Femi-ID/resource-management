import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Resource } from './schemas/resource.schema';
import { Model } from 'mongoose';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { periodFilter, ResourceType } from './enums';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { DashboardFilterDto } from './dto/dashboard-data.dto';

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
      'Response- returns each individual resource information with the total and average consumption.',
  }) /*response of the function here */
  @Get('retrieve/:userId')
  async retrieveResources(
    @Param('userId') userId: string,
    @Query('period') period?: periodFilter,
  ) {
    return this.resourceService.getResourcesByPeriod(userId, period);
  }

  @ApiOkResponse({
    description:
      'Response- the total and average resource consumption over a specified period',
  })
  @Get('summary/:userId')
  async getResourcesSummary(
    @Query('period') period: periodFilter,
    @Param('userId') userId: string,
  ) {
    return this.resourceService.calculateTotalsAndAverages(userId, period);
  }

  @ApiOkResponse({
    description:
      'Response- the data (bar/pie chart) representing the resource consumption over a specific period',
  })
  @Get('dashboard-data/:userId')
  async getDashboardData(
    @Param('userId') userId: string,
    @Query() dashboardFilter: DashboardFilterDto,
  ) {
    return this.resourceService.generateDashboardData(userId, dashboardFilter);
  }
}
