import { Controller, Get, Post, Param, Res } from '@nestjs/common';
import { RequestsService } from '../service/requests.service';
import { Logger } from '@nestjs/common';

@Controller('request')
export class RequestsController {
  private logger = new Logger('RequestsController');
  constructor(private requestsService: RequestsService) {}

  @Get()
  getRequests(): string {
    this.logger.verbose('Getting all requests');
    return this.requestsService.getRequests();
  }

  @Post('/:report_id/:hospital_id')
  createRequest(
    @Param('report_id') report_id: number,
    @Param('hospital_id') hospital_id: number,
  ) {
    this.logger.verbose('환자 이송 신청 POST API');
    return this.requestsService.createRequest(report_id, hospital_id);
  }
}
