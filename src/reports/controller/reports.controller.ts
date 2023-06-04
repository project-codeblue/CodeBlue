import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { ReportsService } from '../service/reports.service';
import { Logger } from '@nestjs/common';
import { Reports } from '../reports.entity';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportDto } from '../dto/update-report.dto';

@Controller('report')
export class ReportsController {
  private logger = new Logger('ReportsController');
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createReport(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.createReport(createReportDto);
  }

  @Get('/:report_id')
  async getReportDetails(
    @Param('report_id') reportId: number,
  ): Promise<Reports> {
    const reportDetails = await this.reportsService.getReportDetails(reportId);
    return reportDetails;
  }

  @Patch('/:report_id')
  async updateReport(
    @Param('report_id') report_id: number,
    @Body() updatedReport: UpdateReportDto,
  ): Promise<Reports> {
    return await this.reportsService.updateReport(report_id, updatedReport);
  }

  @Get('/createdummy')
  createDummyReport() {
    return this.reportsService.createDummyReport();
  }
}
