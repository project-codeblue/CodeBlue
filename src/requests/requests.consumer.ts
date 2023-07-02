import { RequestsService } from './service/requests.service';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

// Consumer는 queue에 쌓인 job들이나 queue의 이벤트를 처리하는 역할
@Processor('requestQueue')
export class RequestQueueConsumer {
  constructor(private readonly requestsService: RequestsService) {}

  // 큐에 job이 추가되면 이를 감지하고,
  // 큐에 쌓인 job들을 FIFO (First In First Out)으로 가져와서 sendRequest() 함수에 전달한다
  @Process('addToRequestQueue')
  async handleAddToRequestQueue(job: Job): Promise<boolean> {
    console.log('*1 handleAddRequestQueue 진입');
    console.log(`${job.data} 작업 수행 중`);

    // 비지니스로직을 수행하는 메서드에 job 전달
    return await this.requestsService.sendRequest(
      job.data.report_id,
      job.data.hospital_id,
      job.data.eventName,
    );
  }
}
