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
import { InjectEntityManager } from '@nestjs/typeorm';
import axios from 'axios';
import { Gender } from '../../patients/patients.enum';
import appConfig from 'config/app.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly patientsRepository: PatientsRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager, // 트랜젝션을 위해 DI
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
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
              // 주민등록번호로 gender 판별
              const gender =
                patient_rrn[7] === '1' || patient_rrn[7] === '3'
                  ? Gender.M
                  : patient_rrn[7] === '2' || patient_rrn[7] === '4'
                  ? Gender.F
                  : null;

              const newPatient =
                await this.patientsRepository.createPatientInfo({
                  patient_rrn,
                  gender,
                });
              patientId = newPatient.patient_id;
            } else {
              patientId = patient.patient_id;
            }
            createReportDto.patient_id = patientId;
          }

          // report 생성
          const { symptoms } = createReportDto;

          const emergencyLevel = await this.getEmergencyLevel(symptoms);
          createReportDto.symptom_level = emergencyLevel;

          return this.reportsRepository.createReport(createReportDto);
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
        const emergencyLevel = await this.getEmergencyLevel(
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

  async getEmergencyLevel(symptoms: string) {
    const emergencyLevelApiResponse = await axios.get(this.config.aiServerUrl, {
      params: {
        sentence: symptoms,
      },
    });

    return emergencyLevelApiResponse.data.emergency_level;
  }
}
