import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySupplierDto {
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

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['cement', 'sand', 'stone', 'admixture', 'comprehensive', 'other'], {
    message: '供应商类型不正确',
  })
  @IsOptional()
  type?: string;

  @IsEnum(['A', 'B', 'C', 'D'], {
    message: '信用等级不正确',
  })
  @IsOptional()
  creditRating?: string;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsEnum(['asc', 'desc'], { message: '排序方向不正确' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
