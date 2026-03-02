import { IsNumber, IsString, IsEnum, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMaterialDto {
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
  name?: string;

  @IsEnum(['cement', 'sand', 'stone', 'water', 'admixture', 'other'], {
    message: '材料类型不正确',
  })
  @IsOptional()
  type?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  supplierId?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  lowStock?: boolean;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsEnum(['asc', 'desc'], { message: '排序方向不正确' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
