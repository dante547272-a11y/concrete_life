import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRecipeDto {
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

  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  gradeId?: number;

  @IsEnum(['draft', 'published', 'archived'], {
    message: '配方状态不正确',
  })
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsEnum(['asc', 'desc'], { message: '排序方向不正确' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
