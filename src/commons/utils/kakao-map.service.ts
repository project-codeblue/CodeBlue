import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../../../config/app.config';
import axios from 'axios';

@Injectable()
export class KakaoMapService {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  async convertCoordinatesToRegion(
    latitude: number,
    longitude: number,
  ): Promise<string> {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${longitude}&y=${latitude}&input_coord=WGS84`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `KakaoAK ${this.config.kakaoApiKey}`,
      },
    });
    return response.data.documents[0].region_1depth_name;
  }

  async getDrivingDuration(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ): Promise<number> {
    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${startLng},${startLat}&destination=${endLng},${endLat}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `KakaoAK ${this.config.kakaoApiKey}`,
      },
    });

    const duration = response.data.routes[0].summary.duration;
    console.log('duration: ', duration, 'seconds');
    return duration;
  }
}
