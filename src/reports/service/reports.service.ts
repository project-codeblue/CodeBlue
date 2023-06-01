import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ReportsRepository } from '../reports.repository';
import { Reports } from '../reports.entity';
import { UpdateReportDto } from '../dto/update-report.dto';
import { KakaoMapService } from '../../commons/utils/kakao-map.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly kakaoMapApi: KakaoMapService,
  ) {}

  async updatePatientLocation(
    report_id: number,
    updatedLocation: UpdateReportDto,
  ) {
    try {
      const { longitude, latitude } = updatedLocation;

      const report = await this.reportsRepository.findReport(report_id);

      if (!report) {
        throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
      }

      const site = await this.kakaoMapApi.convertCoordinatesToRegion(
        latitude,
        longitude,
      );

      const updatedReportInfo =
        await this.reportsRepository.updatePatientLocation(
          report_id,
          longitude,
          latitude,
        );

      return {
        ...updatedReportInfo,
        site,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        '사용자 현재 위치 변경에 실패하였습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 더미 데이터 생성 API (추후 제거 예정)
  async createDummyReport() {
    const start: any = new Date();
    const symptom_list = ['소실된 의식', '심부전', '뇌경색 증상', '사지 마비', '의식 변화',
                          '기억 상실', '발작', '혼란 상태', '가슴 통증', '청각 손실',
                          '시야 손실', '감각 소실', '경련', '저림 혹은 저속한 손발', '심한 두통',
                          '기운 없음', '오심', '구토', '호흡곤란', '호흡음',
                          '흉부 압박감', '코막힘', '기침', '저체온증', '혈압 저하',
                          '사지 부종', '혈압 상승', '빈혈', '황달', '목의 부종',
                          '혈액 흘림', '혈뇨', '점막 출혈', '근육통', '화상',
                          '코피', '고열', '음식 섭취 곤란', '알레르기 반응', '가려운 발진',
                          '체중감소'];
    let latitude = 35; let longitude = 127; const count = 0;
    for (let i = 40; i <= 79; i++) { // 병원
      for (let j = 1; j <= 5; j++) { // 환자
        for (let k = 1; k <= 5; k++) {// 증상도
          for (let l = 0; l < 100; l++) {
            const hospital_id = i; const patient_id = j; const symptom_level = k;
            const symptom = [];
            const symptom_count = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
            while (symptom.length < symptom_count) {
              const num = Math.floor(Math.random() * (40 - 0 + 1)) + 0;
              if (symptom.every((e) => symptom_list[num] !== e)) {
                symptom.push(symptom_list[num]);
              }
            }
            latitude += 0.0001; longitude += 0.0001;
            if (latitude > 38) {
              latitude = 35;
            }
            if (longitude > 129) {
              latitude = 127;
            }
            await this.reportsRepository.createDummyReport( hospital_id, patient_id, symptom_level, symptom, latitude, longitude,);
          }
        }
      }
    }
    const end: any = new Date();
    const t = end - start;
    console.log(`소요시간 : ${t / 1000}초`);
    console.log(`${count}개 생성`);
  }
}
