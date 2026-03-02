import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('vehicles')
@UseGuards(RolesGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * 创建车辆
   */
  @Post()
  @Roles('admin', 'manager')
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.vehiclesService.create(createVehicleDto, userId);
  }

  /**
   * 查询车辆列表
   */
  @Get()
  findAll(@Query() query: QueryVehicleDto) {
    return this.vehiclesService.findAll(query);
  }

  /**
   * 获取车辆统计
   */
  @Get('statistics')
  getStatistics(@Query('siteId') siteId?: string) {
    return this.vehiclesService.getStatistics(
      siteId ? parseInt(siteId) : undefined,
    );
  }

  /**
   * 获取可用车辆列表
   */
  @Get('available')
  getAvailableVehicles(@Query('siteId') siteId?: string) {
    return this.vehiclesService.getAvailableVehicles(
      siteId ? parseInt(siteId) : undefined,
    );
  }

  /**
   * 查询单个车辆
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(+id);
  }

  /**
   * 更新车辆
   */
  @Patch(':id')
  @Roles('admin', 'manager')
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.vehiclesService.update(+id, updateVehicleDto, userId);
  }

  /**
   * 更新车辆状态
   */
  @Patch(':id/status')
  @Roles('admin', 'manager', 'operator')
  updateStatus(
    @Param('id') id: string,
    @Body() updateVehicleStatusDto: UpdateVehicleStatusDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.vehiclesService.updateStatus(+id, updateVehicleStatusDto.status, userId);
  }

  /**
   * 删除车辆
   */
  @Delete(':id')
  @Roles('admin', 'manager')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(+id);
  }
}
