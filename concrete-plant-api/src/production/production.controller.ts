import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { QueryBatchDto } from './dto/query-batch.dto';
import { CreateBatchRecordDto } from './dto/create-batch-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('production')
@UseGuards(JwtAuthGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('batches')
  createBatch(@Body() createBatchDto: CreateBatchDto, @Request() req: any) {
    return this.productionService.createBatch(createBatchDto, req.user.userId);
  }

  @Get('batches')
  findAllBatches(@Query() query: QueryBatchDto) {
    return this.productionService.findAllBatches(query);
  }

  @Get('batches/:id')
  findOneBatch(@Param('id') id: string) {
    return this.productionService.findOneBatch(+id);
  }

  @Patch('batches/:id')
  updateBatch(@Param('id') id: string, @Body() updateBatchDto: UpdateBatchDto, @Request() req: any) {
    return this.productionService.updateBatch(+id, updateBatchDto, req.user.userId);
  }

  @Post('batches/:id/start')
  startBatch(@Param('id') id: string, @Request() req: any) {
    return this.productionService.startBatch(+id, req.user.userId);
  }

  @Post('batches/:id/complete')
  completeBatch(@Param('id') id: string, @Body('actualQuantity') actualQuantity: number, @Request() req: any) {
    return this.productionService.completeBatch(+id, actualQuantity, req.user.userId);
  }

  @Post('records')
  createBatchRecord(@Body() createBatchRecordDto: CreateBatchRecordDto, @Request() req: any) {
    return this.productionService.createBatchRecord(createBatchRecordDto, req.user.userId);
  }

  @Patch('records/:id')
  updateBatchRecord(@Param('id') id: string, @Body('actualQuantity') actualQuantity: number, @Request() req: any) {
    return this.productionService.updateBatchRecord(+id, actualQuantity, req.user.userId);
  }

  @Get('statistics')
  getStatistics(
    @Query('siteId') siteId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.productionService.getStatistics(
      siteId ? +siteId : undefined,
      startDate,
      endDate,
    );
  }
}
