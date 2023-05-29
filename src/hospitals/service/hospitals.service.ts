import { Injectable } from '@nestjs/common';
import { HospitalsRepository } from '../hospitals.repository';
import { crawl } from 'src/commons/middlewares/crawl';

@Injectable()
export class HospitalsService {
  constructor(private hospitalsRepository: HospitalsRepository) {}

  getHospitals() {
    return this.hospitalsRepository.getHospitals();
  }

  getNearByHospitals() {
    let site = '경기도'; // 여기에 지역명이 들어가며, 지역리스트는 미들웨어를 참고해주세요.

    // 크롤링 미들웨어 실행
    const results = crawl(site);

    return results;
  }
}
