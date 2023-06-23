import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { ReportsService } from './reports/service/reports.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly reportService: ReportsService,
  ) {}

  @Get()
  @Render('index')
  root() {
  }

  @Get('/search')
  @Render('reportSearchEngine')
  search() {
  }

  @Get('/symptom-report')
  @Render('createReport')
  report() {
  }
}
