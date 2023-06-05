import {
  Controller,
  Get,
  Param,
  Body,
  Post,
  NotFoundException,
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
    return this.reportsService.createReport(createReportDto);
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
