import { Injectable } from '@nestjs/common';
import { HospitalsRepository } from '../hospitals.repository';

@Injectable()
export class HospitalsService {
  constructor(private hospitalsRepository: HospitalsRepository) {}

  getHospitals() {
    return this.hospitalsRepository.getHospitals();
  }
}
