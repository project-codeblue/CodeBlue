import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  root() {
    return { name: 'name' };
  }

  @Get('/search')
  @Render('reportSearchEngine')
  search() {
    return { name: 'name' };
  }

  @Get('/report')
  @Render('createReport')
  report() {
    return { name: 'name' };
  }
}
