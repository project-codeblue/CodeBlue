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
  updatePatientLocation(
    @Param('report_id') report_id: number,
    @Body() updatedLocation: UpdateReportDto,
  ) {
    this.logger.verbose('사용자 위치 변경 PATCH API');
    return this.reportsService.updatePatientLocation(
      report_id,
      updatedLocation,
    );
  }

  @Get('/createdummy')
  createDummyReport() {
    return this.reportsService.createDummyReport();
  }
}
