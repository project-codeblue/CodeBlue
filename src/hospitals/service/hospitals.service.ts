import { Injectable, Inject } from '@nestjs/common';
import { HospitalsRepository } from '../hospitals.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Hospitals } from '../hospitals.entity';
import axios from 'axios';
import appConfig from 'config/app.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class HospitalsService {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
    @InjectRepository(Hospitals)
    private hospitalsRepository: HospitalsRepository,
  ) {}

  // getHospitals() {
  //   return this.hospitalsRepository.getHospitals();
  // }
  async calculateDurations(
    startLng: number,
    startLat: number,
    endLng: number,
    endLat: number,
  ) {
    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${startLng},${startLat}&destination=${endLng},${endLat}`;
    const apiKey = '5b629c775c0a43779bb07d36c4353477';
    const headers = {
      Authorization: `KakaoAK ${apiKey}`,
    };

    const response = await axios.get(url, {
      headers,
    });
    const duration = response.data.routes[0].summary.duration;
    return duration;
  }
  async getHospitals(report_id: number) {
    const userLocation = await this.hospitalsRepository.findReport(report_id);

    let startLat = userLocation.latitude;
    let startLng = userLocation.longitude;
    const HospitalsData = await this.hospitalsRepository.AllHospitals();

    const getRecommandHopitals = [];

    for (const hospital of HospitalsData) {
      const endLat = hospital.latitude;
      const endLng = hospital.longitude;
      try {
        const duration = await this.calculateDurations(
          startLng,
          startLat,
          endLng,
          endLat,
        );

        getRecommandHopitals.push({
          duration: duration,
          hospital: hospital.name,
          phone: hospital.phone,
          available_beds: hospital.available_beds,
        });
      } catch (error) {
        console.error(error);
      }
    }

    getRecommandHopitals.sort((a, b) => a.duration - b.duration);
    return getRecommandHopitals.slice(0, 3);
  }
}
