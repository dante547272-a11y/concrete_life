import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('config')
@UseGuards(JwtAuthGuard)
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @Roles('admin')
  findAll(@Query('category') category?: string) {
    return this.configService.findAll(category);
  }

  @Get('public')
  @Public()
  getPublicConfigs() {
    return this.configService.getPublicConfigs();
  }

  @Get(':key')
  @Roles('admin', 'manager')
  findOne(@Param('key') key: string) {
    return this.configService.findOne(key);
  }

  @Post()
  @Roles('admin')
  create(@Body() createConfigDto: CreateConfigDto, @Request() req: any) {
    return this.configService.create(createConfigDto, req.user.userId);
  }

  @Post('initialize')
  @Roles('admin')
  initializeDefaultConfigs() {
    return this.configService.initializeDefaultConfigs();
  }

  @Post('batch-update')
  @Roles('admin')
  batchUpdate(
    @Body('configs') configs: Array<{ key: string; value: any }>,
    @Request() req: any,
  ) {
    return this.configService.batchUpdate(configs, req.user.userId);
  }

  @Patch(':key')
  @Roles('admin')
  update(
    @Param('key') key: string,
    @Body() updateConfigDto: UpdateConfigDto,
    @Request() req: any,
  ) {
    return this.configService.update(key, updateConfigDto, req.user.userId);
  }

  @Delete(':key')
  @Roles('admin')
  remove(@Param('key') key: string) {
    return this.configService.remove(key);
  }
}
