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

  // GET: 이송 신청된 증상보고서 전체 조회 API
  @Get()
  getAllRequests(): Promise<Reports[]> {
    this.logger.verbose('증상 보고서 전체 조회 GET API');
    return this.requestsService.getAllRequests();
  }

  // POST: 환자 이송 신청 API
  @Post('/:report_id/:hospital_id')
  sendRequest(
    @Param('report_id') report_id: number,
    @Param('hospital_id') hospital_id: number,
  ): Promise<object> {
    this.logger.verbose('환자 이송 신청 POST API');
    return this.requestsService.addRequestQueue(report_id, hospital_id);
  }

  // DELETE: 환자 이송 신청 철회 API
  @Delete('/:report_id')
  withdrawRequest(@Param('report_id') report_id: number): Promise<object> {
    this.logger.verbose('환자 이송 신청 철회 DELETE API');
    return this.requestsService.withdrawRequest(report_id);
  }

  // GET: 이송 신청된 증상보고서 검색 API
  @Get('/search')
  @Render('searchResult')
  async getSearchRequests(@Query() queries: object): Promise<object> {
    try {
      this.logger.verbose('증상 보고서 검색 GET API');
      const searchedData = await this.requestsService.getSearchRequests(
        queries,
      );
      return { searchedData };
    } catch (error) {
      return { searchedData: error };
    }
  }
}
