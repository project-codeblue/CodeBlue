import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HospitalsRepository } from '../hospitals.repository';
import { ReportsRepository } from '../../reports/reports.repository';
import { Crawling } from '../../commons/middlewares/crawling';
import { KakaoMapService } from '../../commons/providers/kakao-map.provider';
import { InjectEntityManager } from '@nestjs/typeorm'; //transaction사용을 위한 모듈 임포트
import { EntityManager } from 'typeorm'; //transaction사용을 위한 모듈 임포트

@Injectable()
export class HospitalsService {
  constructor(
    private hospitalsRepository: HospitalsRepository,
    private reportsRepository: ReportsRepository,
    private crawling: Crawling,
    private kakaoMapService: KakaoMapService,
    @InjectEntityManager() private readonly entityManager: EntityManager, // 트랜젝션을 위해 DI
  ) {}

  // GET: 병원 추천 및 병상 조회 (종합상황판 기반) API
  async getRecommendedHospitals(
    report_id: number,
    queries: object,
  ): Promise<object> {
    try {
      return await this.entityManager.transaction(
        'READ COMMITTED',
        async () => {
          const report = await this.reportsRepository.findReport(report_id);
          if (!report) {
            throw new NotFoundException(
              `해당 아이디: ${report_id}는 존재하지 않습니다.`,
            );
          }

          const startLat = parseFloat(queries['latitude']);
          const startLng = parseFloat(queries['longitude']);

          let dataSource = [];
          let hospitals = [];
          let radius: number;
          const max_count = queries['max_count']
            ? parseInt(queries['max_count'])
            : 20;

          // 사용자 위치 기반 추천 병원 DB에서 받아오기
          if (queries['radius']) {
            radius = parseInt(queries['radius']) * 1000; // radius in meters
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

          hospitals = Object.entries(dataSource); // 배열로 반환

          if (max_count < hospitals.length) {
            hospitals = hospitals.slice(0, max_count); // 사용자가 원하는 만큼만 뱡원 추천
          }

          // 카카오 mobility API적용 최단시간 거리 계산 (병렬 처리)
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

            const obj = {
              duration,
              minutes: `${minutes}분`,
              seconds: `${seconds}초`,
              distance: (distance / 1000).toFixed(1),
              hospital_id: hospital[1]['hospital_id'],
              name: hospital[1]['name'],
              phone: hospital[1]['phone'],
              available_beds: hospital[1]['available_beds'],
              emogList: hospital[1]['emogList'],
            };
            return obj;
          });

          // 병렬 처리된 결과를 기다렸다가 변수에 저장
          let recommendedHospitals = await Promise.all(promises);

          // KaKao Mobility로 구한 거리가 ST_Distance_Sphere로 구한 거리보다 더 큰 경우
          if (queries['radius']) {
            recommendedHospitals = recommendedHospitals.filter(
              (hospital) => parseFloat(hospital['distance']) * 1000 <= radius,
            );
          }

          // 이동 시간 + 가용 병상수를 고려하여 가중치 적용
          const weightsRecommendedHospitals = [];

          for (const hospital of recommendedHospitals) {
            const maxDuration = Math.max(
              ...recommendedHospitals.map((hospital) => hospital.duration),
            );
            const maxAvailable_beds = Math.max(
              ...recommendedHospitals.map(
                (hospital) => hospital.available_beds,
              ),
            );
            const rating = await this.calculateRating(
              hospital,
              maxDuration,
              maxAvailable_beds,
            );
            hospital['rating'] = rating;
            weightsRecommendedHospitals.push(hospital);
          }

          // 최단거리 병원 duration 낮은 순 (단위:sec)
          weightsRecommendedHospitals.sort((a, b) => b.rating - a.rating);

          // 실시간 가용 병상 정보 크롤링
          const emogList = [];
          for (const hospital of weightsRecommendedHospitals) {
            emogList.push(hospital['emogList']);
          }
          const datas = await this.crawling.getRealTimeHospitalsBeds(emogList);
          const results: Array<string | object> = await Promise.all(
            weightsRecommendedHospitals.map(async (hospital) => {
              const result = { ...hospital, report_id };
              for (const data of datas) {
                if (data.slice(0, 8) === hospital.emogList) {
                  const beds_object = await this.parseHospitalData(data);
                  result['real_time_beds_info'] = beds_object;
                }
              }
              return result;
            }),
          );

          // FE를 위해 추가된 데이터
          const selectedHospital = report.hospital_id
            ? await this.hospitalsRepository.findHospital(report.hospital_id)
            : null;
          results.unshift(selectedHospital); // 사용자가 선택한 병원 정보 - index 2번 저장
          results.unshift(report); // 증상보고서 내용 - index 1번 저장
          results.unshift(datas[0]); // 크롤링 데이터 받아온 timeline - index 0번 저장

          return results;
        },
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        error.response.data || '병원 조회에 실패하였습니다.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET: 주변 병원 조회 API
  async getNearbyHospitals(queries: object): Promise<object> {
    // parseFloat = 문자열을 부동 소수점 숫자로 변환
    const startLat = parseFloat(queries['latitude']);
    const startLng = parseFloat(queries['longitude']);

    let dataSource = [];
    let hospitals = [];

    const radius = 20 * 1000; // radius in meters

    if (startLat && startLng) {
      dataSource = await this.hospitalsRepository.getHospitalsWithinRadius(
        startLat,
        startLng,
        radius,
      );
    } else {
      dataSource = await this.hospitalsRepository.getHospitalsWithinRadius(
        37.56615,
        126.97814,
        radius,
      );
    }

    hospitals = Object.entries(dataSource); // 배열로 반환

    const datas = hospitals.map((data) => {
      const obj = {
        name: data[1]['name'],
        address: data[1]['address'],
        phone: data[1]['phone'],
        distance: data[1]['distance'],
      };
      return obj;
    });

    return datas;
  }

  // 가중치 점수 계산 메서드
  async calculateRating(
    hospital: any,
    maxDuration: number,
    maxAvailable_beds: number,
  ): Promise<number> {
    const weights = {
      duration: 0.98,
      available_beds: 0.02,
    };
    const durationWeight = weights.duration; // 98%
    const available_bedsWeight = weights.available_beds; // 2%

    //duration = 값이 낮을 수록 높은 점수
    const durationScore = 1 - hospital.duration / maxDuration;

    //available_beds = 값이 높을 수록 높은 점수
    const available_bedsScore = hospital.available_beds / maxAvailable_beds;
    const rating =
      durationWeight * durationScore +
      available_bedsWeight * available_bedsScore;
    return rating;
  }

  // 크롤링 데이터 파싱 메서드
  async parseHospitalData(data: string): Promise<object> {
    const emergencyRoomRegex = /응급실:\s*(\d+(?:\s\/\s\d+)?)/;
    const surgeryRoomRegex = /수술실:\s*(\d+(?:\s\/\s\d+)?)/;
    const wardRegex = /입원실:\s*(\d+(?:\s\/\s\d+)?)/;
    const emergencyRoom = data.match(emergencyRoomRegex);
    const surgeryRoom = data.match(surgeryRoomRegex);
    const ward = data.match(wardRegex);
    return {
      emergencyRoom: emergencyRoom ? emergencyRoom[1] : '정보없음',
      surgeryRoom: surgeryRoom ? surgeryRoom[1] : '정보없음',
      ward: ward ? ward[1] : '정보없음',
    };
  }
}
