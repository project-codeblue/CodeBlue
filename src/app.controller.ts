import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { ReportsService } from './reports/service/reports.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly reportService: ReportsService
  ) {}

  @Get()
  @Render('index')
  root() {
    return { name: 'name' };
  }

  @Get('/search')
  @Render('reportSearchEngine')
  async search() {
    const count = await this.reportService.getDataCount();
    return { count: count };
  }

  @Get('/report')
  @Render('createReport')
  report() {
    return { name: 'name' };
  }
}

