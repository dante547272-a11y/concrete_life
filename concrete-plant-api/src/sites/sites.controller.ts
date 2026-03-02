import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySiteDto } from './dto/query-site.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @Roles('admin', 'manager')
  create(@Body() createSiteDto: CreateSiteDto, @Request() req: any) {
    return this.sitesService.create(createSiteDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: QuerySiteDto) {
    return this.sitesService.findAll(query);
  }

  @Get('statistics')
  getStatistics(@Query('id') id?: string) {
    return this.sitesService.getStatistics(id ? +id : undefined);
  }

  @Get('nearby')
  findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
  ) {
    return this.sitesService.findNearby(
      +latitude,
      +longitude,
      radius ? +radius : 50,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sitesService.findOne(+id);
  }

  @Get(':id/statistics')
  getDetailedStatistics(@Param('id') id: string) {
    return this.sitesService.getDetailedStatistics(+id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto, @Request() req: any) {
    return this.sitesService.update(+id, updateSiteDto, req.user.userId);
  }

  @Patch(':id/status')
  @Roles('admin', 'manager')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.sitesService.updateStatus(+id, status, req.user.userId);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.sitesService.remove(+id);
  }
}
