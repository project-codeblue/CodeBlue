import {
  Controller,
  Get,
  Param,
  Body,
  Post,
  Patch,
  Render,
} from '@nestjs/common';
import { ReportsService } from '../service/reports.service';
import { Logger } from '@nestjs/common';
import { Reports } from '../reports.entity';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportDto } from '../dto/update-report.dto';
import { ReportBodyValidationPipe } from '../pipe/report-body-data-validation.pipe';
import { RrnValidationPipe } from '../pipe/rrn-validation.pipe';

@Controller('report')
export class ReportsController {
  private logger = new Logger('ReportsController');
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createReport(
    @Body('patient_rrn', new RrnValidationPipe()) patient_rrn: string,
    @Body(new ReportBodyValidationPipe()) createReportDto: CreateReportDto,
  ) {
    this.logger.verbose('증상 보고서 생성 POST API');
    return this.reportsService.createReport(createReportDto, patient_rrn);
  }

  @Get('/:report_id')
  @Render('reportDetail')
  async getReportDetails(
    @Param('report_id') reportId: number,
  ): Promise<object> {
    this.logger.verbose('증상 보고서 상세 조회 GET API');
    const reportDetails = await this.reportsService.getReportDetails(reportId);
    return { reportDetails };
  }

  @Patch('/:report_id')
  async updateReport(
    @Param('report_id') report_id: number,
    @Body(new ReportBodyValidationPipe()) updatedReport: UpdateReportDto,
  ): Promise<Reports> {
    this.logger.verbose('증상 보고서 수정 PATCH API');
    return await this.reportsService.updateReport(report_id, updatedReport);
  }

  @Get('/create/dummy')
  createDummyReport() {
    return this.reportsService.createDummyReport();
  }
}
