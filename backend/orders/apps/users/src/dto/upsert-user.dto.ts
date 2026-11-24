import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertUserDto {
  @ApiProperty({ example: 'Amadou Diallo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'amadou@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
