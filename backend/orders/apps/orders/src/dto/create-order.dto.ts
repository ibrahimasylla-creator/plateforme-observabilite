import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'PRD-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  id!: string;

  @ApiProperty({ example: 'Instance Cloud Standard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'USR-101' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  userId!: string;

  @ApiProperty({ example: 'Amadou Diallo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  userName!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiProperty({ example: 240 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  amount!: number;
}
