import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ReportsRepository } from '../reports.repository';
import { PatientsRepository } from '../../patients/patients.repository';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportDto } from '../dto/update-report.dto';
import { EntityManager } from 'typeorm';
import axios from 'axios';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Gender } from '../../patients/patients.enum';
import appConfig from '../../../config/app.config';
import { ConfigType } from '@nestjs/config';
import { Patients } from '../../patients/patients.entity';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly patientsRepository: PatientsRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager, // 트랜젝션을 위해 DI
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  // POST: 증상 보고서 생성 API
  async createReport(
    createReportDto: CreateReportDto,
    patient_rrn: string,
    name: string,
  ): Promise<object> {
    try {
      return await this.entityManager.transaction(
        'READ COMMITTED',
        async () => {
          // 환자 주민등록번호가 함께 전달된 경우, Patients table에 환자 정보 저장
          if (patient_rrn) {
            const patient = await this.patientsRepository.findByRRN(
              patient_rrn,
            );
            let patientId: number;

            // 환자 정보가 없는 경우
            if (!patient) {
              // 주민등록번호로 gender 판별
              const gender = await this.getGender(patient_rrn);

              let newPatient: Patients;

              // 환자 이름도 함께 전달된 경우 이름까지 저장
              if (name) {
                newPatient = await this.patientsRepository.createPatientInfo({
                  patient_rrn,
                  gender,
                  name,
                });
              }
              // 주민번호만 전달된 경우
              else {
                newPatient = await this.patientsRepository.createPatientInfo({
                  patient_rrn,
                  gender,
                });
              }
              patientId = newPatient.patient_id;
            }
            // 환자 정보가 이미 있는 경우
            else {
              patientId = patient.patient_id;

              if (name) {
                await this.patientsRepository.updatePatientInfo(patientId, {
                  name,
                });
              }
            }

            createReportDto.patient_id = patientId;
          }

          // Reports table에 report 저장
          const { symptoms } = createReportDto;

          // 중증도 레벨 판단 AI 서버 호출
          const emergencyLevel = await this.callAIServerForEmergencyLevel(
            symptoms,
          );
          createReportDto.symptom_level = emergencyLevel;

          return this.reportsRepository.createReport(createReportDto);
        },
      );
    } catch (error) {
      throw new HttpException(
        error.response || '증상 보고서 생성에 실패하였습니다.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET: 증상보고서 상세 조회 API
  async getReportDetails(report_id: number): Promise<object> {
    const report = await this.reportsRepository.findReport(report_id);
    if (!report) {
      throw new NotFoundException('일치하는 증상 보고서가 없습니다');
    }

    let result: object;
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

  // PATCH: 증상 보고서 수정 API
  async updateReport(
    report_id: number,
    updateReportDto: UpdateReportDto,
  ): Promise<object> {
    try {
      const report = await this.reportsRepository.findReport(report_id);
      if (!report) {
        throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
      }

      // symptoms 문장이 변경된 경우 symptoms_level 재계산
      if (updateReportDto.symptoms) {
        const emergencyLevel = await this.callAIServerForEmergencyLevel(
          updateReportDto.symptoms,
        );
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

  // 배포된 Flask 서버에 증상 문장을 전달하여 응급도를 얻는 메서드
  async callAIServerForEmergencyLevel(symptoms: string) {
    const emergencyLevelApiResponse = await axios.get(this.config.aiServerUrl, {
      params: {
        sentence: symptoms,
      },
    });

    return emergencyLevelApiResponse.data.emergency_level;
  }

  // 입력된 주민등록번호를 바탕으로 성별을 판별하는 메서드
  async getGender(patient_rrn: string): Promise<Gender> {
    return patient_rrn[7] === '1' || patient_rrn[7] === '3'
      ? Gender.M
      : patient_rrn[7] === '2' || patient_rrn[7] === '4'
      ? Gender.F
      : null;
  }
}
