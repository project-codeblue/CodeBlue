import { RequestsService } from './service/requests.service';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

// Consumer는 queue에 쌓인 job들이나 queue의 이벤트를 처리하는 역할을 한다
@Processor('requestQueue')
export class RequestQueueConsumer {
  constructor(private readonly requestsService: RequestsService) {}

  @Process('addRequestQueue')
  // 큐에 쌓인 job들을 FIFO (First In First Out)으로 가져와서 sendRequest() 함수에 전달한다
  async handleAddRequestQueue(job: Job) {
    console.log('*1 handleAddRequestQueue 진입');
    console.log(`${job.data} 작업 수행 중`);
    return await this.requestsService.sendRequest(
      job.data.report_id,
      job.data.hospital_id,
      job.data.eventName,
    );
  }
}

// 이 파일은 1번, 2번 서버에는 주석 처리하여 배포합니다.
