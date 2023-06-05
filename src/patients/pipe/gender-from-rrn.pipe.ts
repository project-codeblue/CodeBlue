import { PipeTransform, Injectable } from '@nestjs/common';
import { Gender } from '../patients.enum';

@Injectable()
export class GenderFromRrnPipe implements PipeTransform {
  transform(value: any): object {
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
  }
}
