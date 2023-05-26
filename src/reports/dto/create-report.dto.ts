import { IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  symptom_level: number;

  @IsNotEmpty()
  symptoms: string;

  @IsNotEmpty()
  patient_id: number;

  @IsNotEmpty()
  hospital_id: number;

  @IsNotEmpty()
  latitude: number;

  @IsNotEmpty()
  longitude: number;
}
