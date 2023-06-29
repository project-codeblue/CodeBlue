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
import { AgeRange, BloodType } from '../reports.enum';

import { data } from './dataset_fifth';
import * as fs from 'fs';
const filePath = 'src/reports/service/patient-update.txt';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly patientsRepository: PatientsRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager, // 트랜젝션을 위해 DI
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  async createReport(
    createReportDto: CreateReportDto,
    patient_rrn: string,
    name: string,
  ) {
    try {
      return await this.entityManager.transaction(
        'READ COMMITTED',
        async () => {
          // 환자 주민등록번호와 증상이 함께 전달된 경우
          if (patient_rrn) {
            const patient = await this.patientsRepository.findByRRN(
              patient_rrn,
            );
            let patientId: number;

            if (!patient) {
              // 주민등록번호로 gender 판별
              const gender = await this.getGender(patient_rrn);

              let newPatient: Patients;
              if (name) {
                newPatient = await this.patientsRepository.createPatientInfo({
                  patient_rrn,
                  gender,
                  name,
                });
              } else {
                newPatient = await this.patientsRepository.createPatientInfo({
                  patient_rrn,
                  gender,
                });
              }
              patientId = newPatient.patient_id;
            } else {
              patientId = patient.patient_id;

              if (name) {
                await this.patientsRepository.updatePatientInfo(patientId, {
                  name,
                });
              }
            }

            createReportDto.patient_id = patientId;
          }

          // report 생성
          const { symptoms } = createReportDto;

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

  // 증상보고서 상세 조회
  async getReportDetails(report_id: number) {
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

  // 증상 보고서 수정
  async updateReport(report_id: number, updateReportDto: UpdateReportDto) {
    try {
      const report = await this.reportsRepository.findReport(report_id);
      if (!report) {
        throw new NotFoundException('증상 보고서가 존재하지 않습니다.');
      }

      // symptoms가 변경된 경우 symptoms_level 재계산
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

  getRandomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async generateRandomRRN() {
    const year = this.getRandomNumber(1900, 2022);
    const month = this.getRandomNumber(1, 12).toString().padStart(2, '0');
    const day = this.getRandomNumber(1, 28).toString().padStart(2, '0');
    const genderCode = this.getRandomNumber(1, 4);
    const randomNum = this.getRandomNumber(100000, 999999).toString();

    let rrn = '';
    rrn += year.toString().slice(2);
    rrn += month;
    rrn += day;
    rrn += '-';
    rrn += genderCode;
    rrn += randomNum;

    return rrn;
  }

  readFileAsync(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  }

  async generateRandomName() {
    try {
      const data = await this.readFileAsync(filePath);
      const lines = data.split('\n');
      const name_index = this.getRandomNumber(0, 9999);
      const line = lines[name_index];
      const name = line.split(',')[3];
      return name;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async generateAgeRange(rrn) {
    const age = parseInt(rrn.substring(0, 2));

    if (
      age == 0 ||
      age == 1 ||
      age == 2 ||
      age == 3 ||
      age == 4 ||
      (age <= 99 && age >= 60)
    ) {
      return AgeRange.성인;
    } else if (age <= 61 && age >= 24) {
      return AgeRange.노년;
    } else if (age >= 5 && age <= 16) {
      return AgeRange.청소년;
    } else if (age >= 17 && age <= 23) {
      return AgeRange.영유아;
    }

    return null;
  }

  // 더미 데이터 생성 API (추후 제거 예정)
  async createDummyReport() {
    const blood_type_list: BloodType[] = [
      BloodType.A,
      BloodType.B,
      BloodType.AB,
      BloodType.O,
    ];
    const blood_pressure_list: string[] = [
      '120/80',
      '130/85',
      '140/90',
      '150/95',
      '160/100',
    ];
    for (let j = 0; j < 827; j++) {
      // 증상 문장 랜덤 생성
      const symptom_sentence_index: number =
        Math.floor(Math.random() * (2484 - 0 + 1)) + 0;
      const symptoms = data[symptom_sentence_index];

      // 이름 랜덤 생성
      const name = await this.generateRandomName();

      // 주민등록번호 랜덤 생성
      const patient_rrn = await this.generateRandomRRN();

      // 연령대 생성
      const age_range = await this.generateAgeRange(patient_rrn);

      // 혈액형 랜덤 생성
      const blood_type_index = this.getRandomNumber(0, 3);
      const blood_type = blood_type_list[blood_type_index];
      // 혈압
      const blood_pressure_index = this.getRandomNumber(0, 4);
      const blood_pressure = blood_pressure_list[blood_pressure_index];

      const createReportDto = {
        symptoms,
        blood_type,
        blood_pressure,
        patient_rrn,
        name,
        age_range,
      };

      console.log('createReportDto: ', createReportDto);

      await this.createReport(createReportDto, patient_rrn, name);
    }
  }
}
