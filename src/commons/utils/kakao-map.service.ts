import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../../../config/app.config';
import axios from 'axios';

@Injectable()
export class KakaoMapService {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  async convertCoordinatesToAddress(
    latitude: number,
    longitude: number,
  ): Promise<string> {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}&input_coord=WGS84`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `KakaoAK ${this.config.kakaoApiKey}`,
      },
    });

    const address = response.data.documents[0].address.address_name;
    return address;
  }

  // 크롤링을 위한 메서드
  async convertCoordinatesToSite(address: string): Promise<string> {
    const site = address.split(' ')[0];
    const siteMap = {
      서울: '서울특별시',
      경기: '경기도',
      강원: '강원도',
      광주: '광주광역시',
      대구: '대구광역시',
      대전: '대전광역시',
      부산: '부산광역시',
      울산: '울산광역시',
      인천: '인천광역시',
      경남: '경상남도',
      경북: '경상북도',
      세종: '세종특별자치시',
      전남: '전라남도',
      전북: '전라북도',
      제주: '제주특별자치도',
      충남: '충청남도',
      충북: '충청북도',
    };

    const convertedSite = siteMap[site] || site;

    return convertedSite;
  }
}
