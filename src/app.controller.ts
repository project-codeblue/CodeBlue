import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {}

  @Get('/search')
  @Render('reportSearchEngine')
  search() {}

  @Get('/symptom-report')
  @Render('createReport')
  report() {}
}
