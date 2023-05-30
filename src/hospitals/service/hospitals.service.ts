import { Injectable, NotFoundException } from '@nestjs/common';
import { HospitalsRepository } from '../hospitals.repository';
import { ReportsRepository } from 'src/reports/reports.repository';
import { Crawling } from 'src/commons/middlewares/crawling';
import { KakaoMapService } from 'src/commons/utils/kakao-map.service';
import { MedicalOpenAPI } from 'src/commons/middlewares/medicalOpenAPI';
import { Hospitals } from '../hospitals.entity';

@Injectable()
export class HospitalsService {
  constructor(
    private hospitalsRepository: HospitalsRepository,
    private reportRepository: ReportsRepository,
    private crawling: Crawling,
    private kakaoMapService: KakaoMapService,
    private openAPI: MedicalOpenAPI,
  ) {}

  async getHospitals(): Promise<Hospitals[]> {
    return await this.hospitalsRepository.getHospitals();
  }

  // 지역 병상 데이터 조회 (string[], 메디서비스 기반)
  async getLocalHospitals(): Promise<string[]> {
    /*
      지역 옵션 선택
      매개변수 site에 아래 지역 중 하나가 들어옵니다.
      서울특별시 / 경기도 / 강원도 / 광주광역시 / 대구광역시
      대전광역시 / 부산광역시 / 울산광역시 / 인천광역시 / 경상남도
      경상북도 / 세종특별자치시 / 전라남도 / 전라북도 / 제주특별자치도
      충청남도 / 충청북도
    */
    const site = '경기도'; // 여기에 지역명이 들어가며, 지역리스트는 미들웨어를 참고해주세요.
    const results = await this.crawling.getLocalHospitaldata(site);
    return results;
  }

  // 전국 병상 데이터 조회 (JSON, 공공데이터 API 기반)
  async getNationHospitals(): Promise<JSON> {
    const results = await this.openAPI.getMedicalData();
    return results;
  }

  // 주변 병상 데이터 조회
  async getNearByHospitals(emogList: string[]): Promise<string[]> {
    const results = await this.crawling.getNearbyHospitals(emogList);
    return results;
  }

  async getReccomendedHospitals(report_id: number) {
    //사용자 위치
    const userLocation = await this.reportRepository.userLocation(report_id);
    // report_id가 없는 경우 예외처리가 필요합니다
    const startLat = userLocation[0];
    const startLng = userLocation[1];

    // 여기서 바로 예외처리를 해주는게 맞는것 같습니다
    if (!startLat || !startLng) {
      // null은 사용자가 없는 값이라고 명시적으로 표기하는 것이기 때문에 값이 실제로 없는 경우는 undefined이 납니다
      throw new NotFoundException(
        '환자의 현재 위치가 정상적으로 반영되지않았습니다.',
      );
    }
    //추천 병원 배열
    const getRecommandHopitals = [];

    //거리 계산 로직
    const HospitalsData = await this.hospitalsRepository.AllHospitals();
    for (const hospital of HospitalsData) {
      const endLat = hospital.latitude;
      const endLng = hospital.longitude;

      const duration = await this.kakaoMapService.getDrivingDuration(
        startLat,
        startLng,
        endLat,
        endLng,
      );
      getRecommandHopitals.push({
        duration: duration,
        hospital: hospital.name,
        phone: hospital.phone,
        available_beds: hospital.available_beds,
      });
      console.log('duration', duration);
      //추후 결과값 반영시 `${hospital.name}까지 예상소요시간 ${Math.floor(duration/60)}분 ${Math.floor(duration%60)초}
    }

    //최단거리 병원 duration 낮은 순(단위:sec)
    getRecommandHopitals.sort((a, b) => a.duration - b.duration);
    return getRecommandHopitals.slice(0, 3);
  }
}
