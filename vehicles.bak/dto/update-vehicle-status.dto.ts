import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateVehicleStatusDto {
  @IsEnum(['available', 'in_use', 'maintenance', 'broken'], {
    message: '车辆状态不正确',
  })
  @IsNotEmpty({ message: '状态不能为空' })
  status: string;
}
