import { IsNumber, IsString, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTaskDto {
  @IsNumber()
  @Min(1, { message: '页码必须大于0' })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1, { message: '每页数量必须大于0' })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  siteId?: number;

  @IsString()
  @IsOptional()
  taskNo?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  orderId?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  vehicleId?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  driverId?: number;

  @IsEnum(['pending', 'assigned', 'in_transit', 'arrived', 'unloading', 'completed', 'cancelled'], {
    message: '任务状态不正确',
  })
  @IsOptional()
  status?: string;

  @IsEnum(['low', 'normal', 'high', 'urgent'], {
    message: '优先级不正确',
  })
  @IsOptional()
  priority?: string;

  @IsDateString({}, { message: '开始日期格式不正确' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: '结束日期格式不正确' })
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsEnum(['asc', 'desc'], { message: '排序方向不正确' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
