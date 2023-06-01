import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsString,
} from 'class-validator';
import { Gender, BloodType } from '../reports.enum';

export class CreateReportDto {
  @IsNotEmpty()
  @IsNumber()
  symptom_level: number;

  @IsNotEmpty()
  @IsString()
  symptoms: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsEnum(BloodType)
  blood_type?: BloodType;
}
