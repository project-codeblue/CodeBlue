import { Injectable, NotFoundException } from '@nestjs/common';
import { HospitalsRepository } from '../hospitals.repository';
import { crawl } from 'src/commons/middlewares/crawl';
import { KakaoMapService } from '../../commons/utils/kakao-map.service';

@Injectable()
export class HospitalsService {
  constructor(
    private hospitalsRepository: HospitalsRepository,
    private kakaomapService: KakaoMapService,
  ) {}

  getHospitals() {
    return this.hospitalsRepository.getHospitals();
  }

  getNearByHospitals() {
    let site = '경기도'; // 여기에 지역명이 들어가며, 지역리스트는 미들웨어를 참고해주세요.

    // 크롤링 미들웨어 실행
    const results = crawl(site);

    return results;
  }

  async getReccomandHospitals(report_id: number) {
   //사용자 위치
    const userLocation = await this.hospitalsRepository.userLocation(report_id);
    let startLat = userLocation[0];
    let startLng = userLocation[1];
   
    //추천 병원 배열
    const getRecommandHopitals = [];
    
    //거리 계산 로직
    const HospitalsData = await this.hospitalsRepository.AllHospitals();
    for (const hospital of HospitalsData) {
      const endLat = hospital.latitude;
      const endLng = hospital.longitude;
      if (startLat === null || startLng === null) {
        throw new NotFoundException('현재위치가 정상적으로 반영되지않았습니다. 새로고침을 눌러주세요');
      }
      try {
        const duration = await this.kakaomapService.getDrivingDuration(
          startLng,
          startLat,
          endLng,
          endLat,
        );
        getRecommandHopitals.push({
          duration: duration,
          hospital: hospital.name,
          phone: hospital.phone,
          available_beds: hospital.available_beds,
        });
        //추후 결과값 반영시 `${hospital.name}까지 예상소요시간 ${Math.floor(duration/60)}분 ${Math.floor(duration%60)초}
      } catch (error) {
        console.error(error);
      }
    }
    //최단거리 병원 duration 낮은 순(단위:sec)
    getRecommandHopitals.sort((a, b) => a.duration - b.duration);
    return getRecommandHopitals.slice(0, 3);
  }
}
