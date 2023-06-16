import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReportsRepository } from '../reports.repository';
import { PatientsRepository } from '../../patients/patients.repository';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportDto } from '../dto/update-report.dto';
import {
  Symptom,
  circulatorySymptoms,
  emergencySymptoms,
  injurySymptoms,
  neurologicalSymptoms,
  otherSymptoms,
  respiratorySymptoms,
} from '../constants/symptoms';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly patientsRepository: PatientsRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager, // 트랜젝션을 위해 DI
  ) {}

  async createReport(createReportDto: CreateReportDto, patient_rrn: string) {
    const createdReport = await this.entityManager.transaction(
      'READ COMMITTED',
      async () => {
        try {
          // 환자 주민등록번호와 증상이 함께 전달된 경우
          if (patient_rrn) {
            const patient = await this.patientsRepository.findByRRN(
              patient_rrn,
            );

            // 환자가 존재하지 않는 경우, 새로운 환자 생성
            let patientId: number;
            if (!patient) {
              const newPatient =
                await this.patientsRepository.createPatientInfo({
                  patient_rrn: patient_rrn,
                });
              patientId = newPatient.patient_id;
            } else {
              patientId = patient.patient_id;
            }
            createReportDto.patient_id = patientId;
          }

          // report 생성
          const { symptoms } = createReportDto;

          const selectedSymptoms = symptoms.split(',');

          const invalidSymptoms = this.getInvalidSymptoms(selectedSymptoms);
          if (invalidSymptoms.length > 0) {
            const error = `유효하지 않은 증상: ${invalidSymptoms.join(', ')}`;
            throw new HttpException(error, HttpStatus.BAD_REQUEST);
          }

          const emergencyLevel = this.calculateEmergencyLevel(selectedSymptoms);
          createReportDto.symptom_level = emergencyLevel;

          return this.reportsRepository.createReport(
            createReportDto,
            emergencyLevel,
          );
        } catch (error) {
          throw new HttpException(
            error.response || '증상 보고서 생성에 실패하였습니다.',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      },
    );
    return createdReport;
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
      return 1;
    } else if (score > 60) {
      return 2;
    } else if (score > 40) {
      return 3;
    } else if (score > 20) {
      return 4;
    } else {
      return 5;
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

  // 증상보고서 상세 조회
  async getReportDetails(report_id: number) {
    const report = await this.reportsRepository.findReport(report_id);
    if (!report) {
      throw new NotFoundException('일치하는 증상 보고서가 없습니다');
    }

    let result;
    // 환자와 병원 정보가 없을 떄
    if (!report.hospital_id && !report.patient_id) {
      result = report;
    }
    // 환자 정보만 있을 때
    else if (!report.hospital_id && report.patient_id) {
      result = await this.reportsRepository.getReportwithPatientInfo(report_id);
    }
    // 병원 정보만 있을 때
    else if (report.hospital_id && !report.patient_id) {
      result = await this.reportsRepository.getReportwithHospitalInfo(
        report_id,
      );
    }
    // 환자와 병원 정보가 모두 있을 때
    else {
      result = await this.reportsRepository.getReportwithPatientAndHospitalInfo(
        report_id,
      );
    }

    return result;
  }

  // 증상 보고서 수정
  async updateReport(report_id: number, updateReportDto: UpdateReportDto) {
    try {
      const report = await this.reportsRepository.findReport(report_id);
      if (!report) {
        throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
      }

      // symptoms가 변경된 경우 symptoms_level 재계산
      if (updateReportDto.symptoms) {
        const selectedSymptoms = updateReportDto.symptoms.split(',');
        const emergencyLevel = this.calculateEmergencyLevel(selectedSymptoms);
        updateReportDto.symptom_level = emergencyLevel;
      }
      return this.reportsRepository.updateReport(report_id, updateReportDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        '증상 보고서 수정에 실패하였습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
