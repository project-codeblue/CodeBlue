import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class RrnValidationPipe implements PipeTransform {
  transform(value: any): object {
    if (value) {
      // 주민등록번호 형식 검사
      const rrnRegex = /^\d{6}-\d{7}$/;

      if (!rrnRegex.test(value)) {
        throw new BadRequestException(
          '주민등록번호 형식이 올바르지 않습니다. (예. 000101-1111111)',
        );
      }
    }

    return value;
  }
}
