import { BloodType, Gender } from '../patients-info.enum';

export class PatientInfoDTO {
  name: string;
  gender: Gender;
  age: number;
  blood_type: BloodType;
  symptoms: string[];
  location: string;
  hospital_id: number;
  symptom_level: number;
}
