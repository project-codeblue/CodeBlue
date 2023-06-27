import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Gender } from '../patients.enum';

@Injectable()
export class PatientBodyValidationPipe implements PipeTransform {
  transform(value: any): object {
    const rrnRegex = /^\d{6}-\d{7}$/;

    // 주민등록번호 형식 검사
    if (value.patient_rnn) {
      if (!rrnRegex.test(value.patient_rrn)) {
        throw new BadRequestException(
          '주민등록번호 형식이 올바르지 않습니다. (예. 000101-1111111)',
        );
      }

      if (value.patient_rrn) {
        const rrn = value.patient_rrn;
        const gender =
          rrn[7] === '1' || rrn[7] === '3'
            ? Gender.M
            : rrn[7] === '2' || rrn[7] === '4'
            ? Gender.F
            : null;

        return {
          ...value,
          gender,
        };
      } else {
        return value;
      }
    } else {
      return value;
    }
  }
}
