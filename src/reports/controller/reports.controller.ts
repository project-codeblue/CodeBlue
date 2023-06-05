import {
  Controller,
  Get,
  Param,
  Body,
  Post,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ReportsService } from '../service/reports.service';
import { Logger } from '@nestjs/common';
import { Reports } from '../reports.entity';
import { CreateReportDto } from '../dto/create-report.dto';

@Controller('report')
export class ReportsController {
  private logger = new Logger('ReportsController');
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createReport(@Body() createReportDto: CreateReportDto) {
    console.log('createReportDto:', createReportDto);
    if (createReportDto.symptoms && createReportDto.patient_rrn) {
      // 환자 주민등록번호와 증상이 함께 전달된 경우
      return this.reportsService.createReportWithPatient({
        ...createReportDto, // 복사본 사용
        patient_rrn: createReportDto.patient_rrn,
      });
    } else if (createReportDto.symptoms) {
      // 증상만 전달된 경우
      return this.reportsService.createReport(createReportDto);
    } else {
      throw new BadRequestException('올바른 요청 형식이 아닙니다.');
    }
  }

  @Get('/:report_id')
  async getReportDetails(
    @Param('report_id') reportId: number,
  ): Promise<Reports> {
    const reportDetails = await this.reportsService.getReportDetails(reportId);
    if (!reportDetails) {
      throw new NotFoundException('일치하는 증상보고서가 없습니다');
    }
    return reportDetails;
  }

  @Get('/createdummy')
  createDummyReport() {
    return this.reportsService.createDummyReport();
  }
}
