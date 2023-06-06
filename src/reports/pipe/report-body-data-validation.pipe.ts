import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ReportBodyValidationPipe implements PipeTransform {
  transform(value: any): object {
    if (value.blood_pressure) {
      // 혈압 형식 검사
      const bloodPressureRegex = /^\d{2,3}\/\d{2,3}$/;

      if (!bloodPressureRegex.test(value.blood_pressure)) {
        throw new BadRequestException(
          '입력하신 혈압의 형식이 올바르지 않습니다. (예. 130/80)',
        );
      }
    }

    return value;
  }
}
