import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@app/database';

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ example: 'USR-101' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
