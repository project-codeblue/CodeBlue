import { OmitType } from '@nestjs/mapped-types';
import { CreateReportDto } from './create-report.dto';

export class UpdateReportDto extends OmitType(CreateReportDto, [
  'symptoms',
  'symptom_level',
]) {}
