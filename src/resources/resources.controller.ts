import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Resource } from './schemas/resource.schema';
import { Model } from 'mongoose';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { periodFilter } from './enums';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

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

  @ApiOkResponse() /*response of the function here */
  @Get('retrieve/:userId')
  async retrieveResources(
    @Param('userId') userId: string,
    @Query('period') period?: periodFilter,
  ) {
    return this.resourceService.getResourcesByPeriod(userId, period);
  }

  @Get('summary/:userId')
  async getResourcesSummary(
    @Query('period') period: periodFilter,
    @Param('userId') userId: string,
  ) {
    return this.resourceService.calculateTotalsAndAverages(userId, period);
  }
}
