import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HospitalsRepository } from '../hospitals.repository';
import { ReportsRepository } from '../../reports/reports.repository';
import { Crawling } from '../../commons/middlewares/crawling';
import { KakaoMapService } from '../../commons/providers/kakao-map.service';
import { MedicalOpenAPI } from '../../commons/middlewares/medicalOpenAPI';
import { Hospitals } from '../hospitals.entity';
import { InjectEntityManager } from '@nestjs/typeorm'; //transaction사용을 위한 모듈 임포트
import { EntityManager } from 'typeorm'; //transaction사용을 위한 모듈 임포트

@Injectable()
export class HospitalsService {
  constructor(
    private hospitalsRepository: HospitalsRepository,
    private reportsRepository: ReportsRepository,
    private crawling: Crawling,
    private kakaoMapService: KakaoMapService,
    private openAPI: MedicalOpenAPI,
    @InjectEntityManager() private readonly entityManager: EntityManager, // 트랜젝션을 위해 DI
  ) {}

  async getHospitals(): Promise<Hospitals[]> {
    return this.hospitalsRepository.getHospitals();
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
    // const start: any = new Date();
    const getHospitals = await this.entityManager.transaction(
      'READ COMMITTED',
      async () => {
        try {
          //사용자 위치
          const report = await this.reportsRepository.findReport(report_id);
          if (!report) {
            throw new NotFoundException(
              `해당 아이디:${report_id}는 존재하지 않습니다.`,
            );
          }
          //parseFloat = 문자열을 부동 소수점 숫자로 변환
          const startLat = parseFloat(queries['latitude']);
          const startLng = parseFloat(queries['longitude']);

          let dataSource = [];
          let hospitals = [];
          const max_count = queries['max_count']
            ? parseInt(queries['max_count'])
            : 20;

          if (queries['radius']) {
            const radius = parseInt(queries['radius']) * 1000; // radius in meters
            dataSource =
              await this.hospitalsRepository.getHospitalsWithinRadius(
                startLat,
                startLng,
                radius,
              );
          } else {
            dataSource =
              await this.hospitalsRepository.getHospitalsWithoutRadius(
                startLng,
                startLat,
              );
          }
          if (dataSource.length === 0) {
            throw new NotFoundException('해당 반경 내에 병원이 없습니다.');
          }

          hospitals = Object.entries(dataSource); //배열로 반환

          if (max_count < hospitals.length) {
            hospitals = hospitals.slice(0, max_count); // 사용자가 원하는 만큼만 추천
          }

          // 카카오map API적용 최단시간 거리 계산
          // console.time('kakaoMapAPI');
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
              throw new NotFoundException(
                '해당 아이디의 위치를 찾을 수 없습니다.',
              );
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
          // console.timeEnd('kakaoMapAPI');

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

          // const end: any = new Date();
          // const t = end - start;
          // console.log(`응답 시간 : ${t}ms`);
          return results;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new HttpException(
            error.response || '병원 조회에 실패하였습니다.',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      },
    );
    return getHospitals;
  }
}
