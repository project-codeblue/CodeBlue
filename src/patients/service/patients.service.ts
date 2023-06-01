import { Injectable } from '@nestjs/common';
import {
  Symptom,
  circulatorySymptoms,
  emergencySymptoms,
  injurySymptoms,
  neurologicalSymptoms,
  otherSymptoms,
  respiratorySymptoms,
} from '../constants/symtoms';
import { Patients } from '../patients.entity';
import { Repository } from 'typeorm';
import { PatientInfoDTO } from '../dto/patientinfo.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PatientsService {
  //저장하기 위한 주입
  constructor(
    @InjectRepository(Patients)
    private patientsRepository: Repository<Patients>,
  ) {}

  //test를 위한 정의
  private symptomCategories: Symptom[];

  setSymptomCategories(categories: Symptom[]): void {
    this.symptomCategories = categories;
  }

  private readonly defaultSymptomCategories = [
    emergencySymptoms,
    neurologicalSymptoms,
    respiratorySymptoms,
    circulatorySymptoms,
    injurySymptoms,
    otherSymptoms,
  ];

  calculateEmergencyLevel(symptoms: string[]): number {
    const symptomScores: number[] = [];
    const symptomCategories =
      this.symptomCategories || this.defaultSymptomCategories;

    symptoms.forEach((symptom) => {
      //같은 카테고리에 정의된 증상들 모으기 위함
      const categoryIndex = this.getSymptomCategoryIndex(
        symptom,
        symptomCategories,
      );

      const score = this.getSymptomScore(
        symptom,
        this.symptomCategories[categoryIndex],
      );
      //같은 카테고리면 가중치 주기
      const count = symptoms.filter((s) => s === symptom).length;
      const adjustedScore = score + 2 * count;
      symptomScores.push(adjustedScore);
    });

    const totalScore = symptomScores.reduce((total, score) => total + score, 0);

    return this.emergencyLevelByScore(totalScore);
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

  private getSymptomCategoryIndex(
    symptom: string,
    symptomCategories: Symptom[],
  ): number {
    for (let i = 0; i < symptomCategories.length; i++) {
      if (symptomCategories[i].hasOwnProperty(symptom)) {
        return i;
      }
    }
    return -1; //카테고리안에 속하지 않는 경우 -> 텍스트 마이닝을 위한 코드
  }

  private getSymptomScore(symptom: string, symptomCategory: Symptom): number {
    return symptomCategory[symptom] || 0;
  }

  async savePatientInfo(patientInfoDTO: PatientInfoDTO): Promise<Patients> {
    const patient = new Patients();
    patient.name = patientInfoDTO.name;
    patient.gender = patientInfoDTO.gender;
    patient.age = patientInfoDTO.age;
    patient.blood_type = patientInfoDTO.blood_type;
    patient.symptoms = patientInfoDTO.symptoms;
    patient.location = patientInfoDTO.location;
    patient.hospital_id = patientInfoDTO.hospital_id;
    patient.symptom_level = this.calculateEmergencyLevel(
      patientInfoDTO.symptoms,
    );
    return this.patientsRepository.save(patient);
  }
}
