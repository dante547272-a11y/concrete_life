import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryVehicleDto {
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
  licensePlate?: string;

  @IsEnum(['mixer_truck', 'pump_truck', 'other'], {
    message: '车辆类型不正确',
  })
  @IsOptional()
  vehicleType?: string;

  @IsEnum(['available', 'in_use', 'maintenance', 'broken'], {
    message: '车辆状态不正确',
  })
  @IsOptional()
  status?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  responsibleUserId?: number;

  @IsString()
  @IsOptional()
  sortBy?: string = 'created_at';

  @IsEnum(['asc', 'desc'], { message: '排序方向不正确' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
