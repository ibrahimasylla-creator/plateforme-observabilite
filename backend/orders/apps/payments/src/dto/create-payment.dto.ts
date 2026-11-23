import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'b3f1c2d4-8a7e-4c1b-9d2f-5e6a7b8c9d0e' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ example: 1250.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  amount!: number;
}
