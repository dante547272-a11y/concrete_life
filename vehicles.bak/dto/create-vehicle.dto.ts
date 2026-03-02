import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsNumber()
  @IsNotEmpty({ message: '站点ID不能为空' })
  siteId: number;

  @IsString()
  @IsNotEmpty({ message: '车牌号不能为空' })
  licensePlate: string;

  @IsEnum(['mixer_truck', 'pump_truck', 'other'], {
    message: '车辆类型不正确',
  })
  @IsNotEmpty({ message: '车辆类型不能为空' })
  vehicleType: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @Min(0, { message: '容量必须大于等于0' })
  @IsOptional()
  capacity?: number;

  @IsDateString({}, { message: '购买日期格式不正确' })
  @IsOptional()
  purchaseDate?: string;

  @IsEnum(['available', 'in_use', 'maintenance', 'broken'], {
    message: '车辆状态不正确',
  })
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  responsibleUserId?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
