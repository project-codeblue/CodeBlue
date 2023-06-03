import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @Length(14, 14) // 주민번호 13자리 + 가운데 - 기호 1자리
  @IsNotEmpty()
  patient_rrn: number;

  @IsOptional()
  @IsString()
  name?: string;
}
