import { Controller, Get } from '@nestjs/common';
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
}
