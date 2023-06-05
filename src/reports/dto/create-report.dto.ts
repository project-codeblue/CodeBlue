import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsString,
} from 'class-validator';
import { AgeRange, BloodType } from '../reports.enum';

export class CreateReportDto {
  @IsOptional()
  @IsNumber()
  symptom_level?: number;

  @IsNotEmpty()
  @IsString()
  symptoms: string;

  @IsOptional()
  @IsNumber()
  blood_pressure?: number;

  @IsOptional()
  @IsEnum(AgeRange)
  age_range?: AgeRange;

  @IsOptional()
  @IsEnum(BloodType)
  blood_type?: BloodType;

  @IsOptional()
  @IsNumber()
  patient_rrn?: number;

  @IsOptional()
  @IsNumber()
  patient_id?: number;
}
