import { Controller, Get } from '@nestjs/common';
import { ReportsService } from '../service/reports.service';
import { Logger } from '@nestjs/common';
import { Reports } from '../reports.entity';

@Controller('report')
export class ReportsController {
  private logger = new Logger('ReportsController');
  constructor(private reportsService: ReportsService) {}

  @Get()
  getAllReports(): Promise<Reports[]> {
    this.logger.verbose('Getting all reports');
    return this.reportsService.getAllReports();
  }
}
