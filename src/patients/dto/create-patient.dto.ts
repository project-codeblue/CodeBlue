import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from '../patients.enum';

export class CreatePatientDto {
  @IsString()
  @Length(14, 14) // 주민번호 13자리 + 가운데 - 기호 1자리
  @IsNotEmpty()
  patient_rrn: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @Transform(({ obj }) => {
    const patientRrn = String(obj.patient_rrn);
    return patientRrn[7] === '1' || patientRrn[7] === '3' ? 'M' : 'F';
  })
  gender: Gender; // 주민번호가 입력되면 성별은 자동으로 입력되게 구현
}
