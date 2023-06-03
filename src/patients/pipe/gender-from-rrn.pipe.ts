import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class GenderFromRrnPipe implements PipeTransform {
  transform(value: any): object {
    console.log('value', value, typeof value);
    const rrn = value.patient_rrn;
    console.log('rrn', rrn, typeof rrn);

    const gender =
      rrn[7] === '1' || rrn[7] === '3'
        ? 'M'
        : rrn[7] === '2' || rrn[7] === '4'
        ? 'W'
        : null;

    return {
      ...value,
      gender,
    };
  }
}
