import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../../../config/app.config';
import axios from 'axios';

@Injectable()
export class KakaoMapService {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  async getDrivingResult(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ): Promise<object> {
    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${startLng},${startLat}&destination=${endLng},${endLat}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `KakaoAK ${this.config.kakaoApiKey}`,
      },
    });

    const duration = response.data.routes[0].summary.duration;
    const distance = response.data.routes[0].summary.distance;
    return { duration, distance };
  }
}
