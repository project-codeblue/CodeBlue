import { Injectable, NotFoundException } from '@nestjs/common';
import { HospitalsRepository } from '../hospitals.repository';
import { ReportsRepository } from '../../reports/reports.repository';
import { Crawling } from '../../commons/middlewares/crawling';
import { KakaoMapService } from '../../commons/utils/kakao-map.service';
import { MedicalOpenAPI } from '../../commons/middlewares/medicalOpenAPI';
import { Hospitals } from '../hospitals.entity';

@Injectable()
export class HospitalsService {
  constructor(
    private hospitalsRepository: HospitalsRepository,
    private reportsRepository: ReportsRepository,
    private crawling: Crawling,
    private kakaoMapService: KakaoMapService,
    private openAPI: MedicalOpenAPI,
  ) {}

  async getHospitals(): Promise<Hospitals[]> {
    return await this.hospitalsRepository.getHospitals();
  }

  // 지역 병상 데이터 조회 (string[], 메디서비스 기반)
  async getLocalHospitals(site: string): Promise<string[]> {
    /*
      지역 옵션 선택
      매개변수 site에 아래 지역 중 하나가 들어옵니다.
      서울특별시 / 경기도 / 강원도 / 광주광역시 / 대구광역시
      대전광역시 / 부산광역시 / 울산광역시 / 인천광역시 / 경상남도
      경상북도 / 세종특별자치시 / 전라남도 / 전라북도 / 제주특별자치도
      충청남도 / 충청북도
    */
    const results = await this.crawling.getLocalHospitaldata(site);
    return results;
  }

  // 전국 병상 데이터 조회 (JSON, 공공데이터 API 기반)
  async getNationHospitals(): Promise<JSON> {
    const results = await this.openAPI.getMedicalData();
    return results;
  }

  // 병원 추천
  async getRecommendedHospitals(
    report_id: number,
    queries: object,
  ): Promise<string[] | object> {
    const start: any = new Date();

    //사용자 위치
    const userLocation = await this.reportsRepository.userLocation(report_id);

    // report_id가 없는 경우 예외처리
    // 고민중

    const startLat = userLocation[0];
    const startLng = userLocation[1];

    let dataSource = [];
    let hospitals = [];
    if (queries['radius']) {
      const radius = parseInt(queries['radius']) * 1000; // radius in meters
      dataSource = await this.hospitalsRepository.query(
        `
          SELECT geo_id, name, phone, available_beds, latitude, longitude, emogList, ST_Distance_Sphere(Point(${startLng}, ${startLat}),
          point) as 'distance'
          FROM geohospital
          WHERE ST_Distance_Sphere(POINT(${startLng}, ${startLat}), point) < (${radius})
          order by distance;
        `,
      );
      hospitals = Object.entries(dataSource);
      if (queries['max_count']) {
        const max_count = parseInt(queries['max_count']);
        // 반경 내에 있는 병원이 max_count보다 적은 경우
        if (hospitals.length > max_count) {
          hospitals = hospitals.slice(0, max_count); // 사용자가 원하는 만큼만 추천
        }
      }
    } else {
      dataSource = await this.hospitalsRepository.query(
        `
          SELECT geo_id, name, phone, available_beds, latitude, longitude, emogList, ST_Distance_Sphere(Point(${startLng}, ${startLat}),
          point) as 'distance'
          FROM geohospital
          order by distance;
        `,
      );
      hospitals = Object.entries(dataSource);
      if (queries['max_count']) {
        const max_count = parseInt(queries['max_count']);
        hospitals = hospitals.slice(0, max_count); // 사용자가 원하는 만큼만 추천
      } else {
        hospitals = hospitals.slice(0, 20); // 20개만 추천
      }
    }

    // 카카오map API적용 최단시간 거리 계산
    console.time('kakaoMapAPI');
    const promises = hospitals.map(async (hospital) => {
      const endLat = hospital[1]['latitude'];
      const endLng = hospital[1]['longitude'];

      const result = await this.kakaoMapService.getDrivingResult(
        startLat,
        startLng,
        endLat,
        endLng,
      );
      const duration = result['duration'];
      const distance = result['distance'];
      if (!duration || !distance) {
        throw new NotFoundException('해당 아이디의 위치를 찾을 수 없습니다.');
      }
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return {
        duration,
        minute: `${minutes}분`,
        secondes: `${seconds}초`,
        distance: `${distance / 1000}km`,
        hospital_id: hospital[1]['hospital_id'],
        name: hospital[1]['name'],
        phone: hospital[1]['phone'],
        available_beds: hospital[1]['available_beds'],
        emogList: hospital[1]['emogList'],
      };
    });

    const recommendedHospitals = await Promise.all(promises);
    console.timeEnd('kakaoMapAPI');

    // 최단거리 병원 duration 낮은 순(단위:sec)
    recommendedHospitals.sort((a, b) => a.duration - b.duration);
    const top10RecommendedHospitals = recommendedHospitals.slice(0, 10);

    const emogList = [];
    for (const hospital of top10RecommendedHospitals) {
      emogList.push(hospital['emogList']);
    }
    const datas = await this.crawling.getNearbyHospitals(emogList);
    const results: Array<string | object> = top10RecommendedHospitals.map(
      (hospital) => {
        const result = { ...hospital };
        for (const data of datas) {
          if (data.slice(0, 8) === hospital.emogList) {
            result['real_time_beds_info'] = data;
          }
        }
        return result;
      },
    );

    results.unshift(datas[0]); // 크롤링 데이터 받아온 timeline

    const end: any = new Date();
    const t = end - start;
    console.log(`응답 시간 : ${t}ms`);
    return results;
  }

  //하버사인(데이터 필터링용)
  async harversine(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ) {
    const R = 6371e3;
    const φ1 = await this.hospitalsRepository.ConvertRadians(startLat);
    const φ2 = await this.hospitalsRepository.ConvertRadians(endLat); //경도만 라디안으로 각각 전환
    const Δφ = await this.hospitalsRepository.ConvertRadians(endLat - startLat); //경도,위도 모두 차이값을 라디안으로 전환
    const Δλ = await this.hospitalsRepository.ConvertRadians(endLng - startLng);
    const arcLenght = await this.hospitalsRepository.arcLength(φ1, φ2, Δφ, Δλ);
    const centralAngle = await this.hospitalsRepository.centralAngle(arcLenght);
    const distance = R * centralAngle;
    return distance;
  }
}
