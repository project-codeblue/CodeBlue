import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  Query,
  Render,
  UseInterceptors,
} from '@nestjs/common';
import { RequestsService } from '../service/requests.service';
import { Logger } from '@nestjs/common';
import { Reports } from 'src/reports/reports.entity';
import { ClearCacheInterceptor } from '../../commons/interceptors/clear-cache.interceptor';

@Controller('request')
@UseInterceptors(ClearCacheInterceptor)
export class RequestsController {
  private logger = new Logger('RequestsController');
  constructor(private requestsService: RequestsService) {}

  @Get()
  getAllRequests(): Promise<Reports[]> {
    this.logger.verbose('증상 보고서 전체 조회 GET API');
    return this.requestsService.getAllRequests();
  }

  // 이 API는 1번, 2번 서버에는 주석 처리하여 배포합니다.
  // --------------------------------------------------------- //
  @Post('/:report_id/:hospital_id')
  sendRequest(
    @Param('report_id') report_id: number,
    @Param('hospital_id') hospital_id: number,
  ) {
    this.logger.verbose('환자 이송 신청 POST API');
    // client는 환자 이송 신청 비지니스 로직이 담긴 sendRequest()를 호출하지 않고, 먼저 addToRequestQueue()를 호출한다.
    return this.requestsService.addRequestQueue(report_id, hospital_id);
  }
  // --------------------------------------------------------- //

  @Delete('/:report_id')
  withdrawRequest(@Param('report_id') report_id: number) {
    this.logger.verbose('환자 이송 신청 철회 DELETE API');
    return this.requestsService.withdrawRequest(report_id);
  }

  @Get('/search')
  @Render('searchResult')
  async getSearchRequests(@Query() queries: object): Promise<object> {
    this.logger.verbose('증상 보고서 검색 GET API');
    console.log(queries);
    const searchedData = await this.requestsService.getSearchRequests(queries);
    return { searchedData };
  }

  @Get('/create/dummy')
  async createDummyRequest() {
    return await this.requestsService.createDummyRequest();
  }
}
