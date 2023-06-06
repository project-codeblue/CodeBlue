import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../../../config/app.config';
import axios from 'axios';

@Injectable()
export class MedicalOpenAPI {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}
  async getMedicalData() {
    const start: any = new Date();

    const url =
      'http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire';
    let queryParams =
      '?' +
      encodeURIComponent('serviceKey') +
      '=' +
      this.config.medicalOpenApiKey;
    queryParams +=
      '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1');
    queryParams +=
      '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('500');

    const totalURL = url + queryParams;

    const data = await axios.get(totalURL);
    const result = await data.data.response.body.items;

    const end: any = new Date();
    const t = end - start;
    console.log(`소요시간 : ${t}ms`);

    return result;
  }
}
