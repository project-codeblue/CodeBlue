import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ReportsService } from '../service/reports.service';
import { Logger } from '@nestjs/common';
import { Reports } from '../reports.entity';
import { UpdateReportDto } from '../dto/update-report.dto';

@Controller('report')
export class ReportsController {
  private logger = new Logger('ReportsController');
  constructor(private readonly reportsService: ReportsService) {}

  @Patch(':report_id')
  updateReportPatientInfo(
    @Param('report_id') report_id: number,
    @Body() updatedPatientInfo: UpdateReportDto,
  ) {
    this.logger.verbose('증상 보고서 환자 정보 수정 PATCH API');
    return this.reportsService.updateReportPatientInfo(
      report_id,
      updatedPatientInfo,
    );
  }

  @Get('/createdummy')
  createDummyReport() {
    return this.reportsService.createDummyReport();
  }
}
