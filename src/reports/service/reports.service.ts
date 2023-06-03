import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReportsRepository } from '../reports.repository';
import { UpdateReportDto } from '../dto/update-report.dto';
import { Reports } from '../reports.entity';
import { CreateReportDto } from '../dto/create-report.dto';
import {
  Symptom,
  circulatorySymptoms,
  emergencySymptoms,
  injurySymptoms,
  neurologicalSymptoms,
  otherSymptoms,
  respiratorySymptoms,
} from '../constants/symptoms';
import { PatientsRepository } from 'src/patients/patients.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly patientsRepository: PatientsRepository,
  ) {}

  // 환자 증상 정보 입력
  async createReport(createReportDto: CreateReportDto) {
    createReportDto.symptoms = JSON.stringify(createReportDto.symptoms);

    // 응급도 계산
    const symptomsString = createReportDto.symptoms;
    const parsedSymptoms = JSON.parse(symptomsString);
    const selectedSymptoms = parsedSymptoms.split(',');

    const invalidSymptoms = this.getInvalidSymptoms(selectedSymptoms);
    if (invalidSymptoms.length > 0) {
      const error = `유효하지 않은 증상: ${invalidSymptoms.join(', ')}`;
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }

    const emergencyLevel = this.calculateEmergencyLevel(selectedSymptoms);
    createReportDto.symptom_level = emergencyLevel;

    return this.reportsRepository.createReport(createReportDto, emergencyLevel);
  }

  // 응급도 알고리즘
  private calculateEmergencyLevel(selectedSymptoms): number {
    const symptomCategories = [
      emergencySymptoms,
      neurologicalSymptoms,
      respiratorySymptoms,
      circulatorySymptoms,
      injurySymptoms,
      otherSymptoms,
    ];

    const symptomScores: number[] = [];

    selectedSymptoms.forEach((symptom) => {
      const categoryIndex = this.getSymptomCategoryIndex(
        symptom,
        symptomCategories,
      );
      const score = this.getSymptomScore(
        symptom,
        symptomCategories[categoryIndex],
      );
      symptomScores.push(score);
    });

    const totalScore = symptomScores.reduce((total, score) => total + score, 0);
    const emergencyLevel = this.emergencyLevelByScore(totalScore);

    return emergencyLevel;
  }

  private getSymptomCategoryIndex(
    symptom: string,
    symptomCategories: Symptom[],
  ): number {
    for (let i = 0; i < symptomCategories.length; i++) {
      if (symptomCategories[i].hasOwnProperty(symptom)) {
        return i;
      }
    }
    return -1;
  }

  private getSymptomScore(symptom: string, symptomCategory: Symptom): number {
    return symptomCategory[symptom] || 0;
  }

  private emergencyLevelByScore(score: number): number {
    if (score > 80) {
      return 5;
    } else if (score > 60) {
      return 4;
    } else if (score > 40) {
      return 3;
    } else if (score > 20) {
      return 2;
    } else {
      return 1;
    }
  }

  private getInvalidSymptoms(selectedSymptoms: string[]): string[] {
    const validSymptoms = [
      ...Object.keys(emergencySymptoms),
      ...Object.keys(neurologicalSymptoms),
      ...Object.keys(respiratorySymptoms),
      ...Object.keys(circulatorySymptoms),
      ...Object.keys(injurySymptoms),
      ...Object.keys(otherSymptoms),
    ];

    return selectedSymptoms.filter(
      (symptom) => !validSymptoms.includes(symptom),
    );
  }

  //환자 정보 업데이트
  async updateReportPatientInfo(
    report_id: number,
    updatedPatientInfo: UpdateReportDto,
  ): Promise<Reports> {
    try {
      const report = await this.reportsRepository.findReport(report_id);

      if (!report) {
        throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
      }

      return await this.reportsRepository.updateReportPatientInfo(
        report_id,
        updatedPatientInfo,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        '증상 보고서 환자 데이터 변경에 실패하였습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 증상보고서 상세 조회
  async getReportDetails(report_id: number) {
    const reportDetails = await this.reportsRepository.getReportDetails(
      report_id,
    );
    if (!reportDetails) {
      throw new NotFoundException('일치하는 증상보고서가 없습니다');
    }
    return reportDetails;
  }

  // 더미 데이터 생성 API (추후 제거 예정)
  async createDummyReport() {
    const start: any = new Date();
    const symptom_list: string[] = [
      '소실된 의식',
      '심부전',
      '뇌경색 증상',
      '사지 마비',
      '의식 변화',
      '기억 상실',
      '발작',
      '혼란 상태',
      '가슴 통증',
      '청각 손실',
      '시야 손실',
      '감각 소실',
      '경련',
      '저림 혹은 저속한 손발',
      '심한 두통',
      '기운 없음',
      '오심',
      '구토',
      '호흡곤란',
      '호흡음',
      '흉부 압박감',
      '코막힘',
      '기침',
      '저체온증',
      '혈압 저하',
      '사지 부종',
      '혈압 상승',
      '빈혈',
      '황달',
      '목의 부종',
      '혈액 흘림',
      '혈뇨',
      '점막 출혈',
      '근육통',
      '화상',
      '코피',
      '고열',
      '음식 섭취 곤란',
      '알레르기 반응',
      '가려운 발진',
      '체중감소',
    ];
    let latitude = 35;
    let longitude = 127;
    const count = 0;
    for (let i = 40; i <= 79; i++) {
      // 병원
      for (let j = 1; j <= 5; j++) {
        // 환자
        for (let k = 1; k <= 5; k++) {
          // 증상도
          for (let l = 0; l < 100; l++) {
            const hospital_id: number = i;
            const patient_id: number = j;
            const symptom_level: number = k;
            const symptom: string[] = [];
            const symptom_count: number =
              Math.floor(Math.random() * (5 - 1 + 1)) + 1;
            while (symptom.length < symptom_count) {
              const num: number = Math.floor(Math.random() * (40 - 0 + 1)) + 0;
              if (symptom.every((e) => symptom_list[num] !== e)) {
                symptom.push(symptom_list[num]);
              }
            }
            latitude += 0.0001;
            longitude += 0.0001;
            if (latitude > 38) {
              latitude = 35;
            }
            if (longitude > 129) {
              latitude = 127;
            }
            await this.reportsRepository.createDummyReport(
              hospital_id,
              patient_id,
              symptom_level,
              symptom,
              latitude,
              longitude,
            );
          }
        }
      }
    }
    const end: any = new Date();
    const t: number = end - start;
    console.log(`소요시간 : ${t / 1000}초`);
    console.log(`${count}개 생성`);
  }
}
