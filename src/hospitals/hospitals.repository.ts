import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Hospitals } from './hospitals.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

const DEFAULT_AVAILABLE_BEDS = 5;

@Injectable()
export class HospitalsRepository extends Repository<Hospitals> {
  constructor(private dataSource: DataSource) {
    super(Hospitals, dataSource.createEntityManager());
  }

  async getHospitals(): Promise<Hospitals[]> {
    return await this.find();
  }

  async findHospital(hospital_id: number): Promise<Hospitals> {
    return await this.findOne({ where: { hospital_id } });
  }

  async updateAvailableBeds(hospital_id: number): Promise<void> {
    await this.update(
      { hospital_id },
      {
        available_beds: () => 'available_beds - 1',
      },
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async setDefaultAvailableBeds(): Promise<void> {
    const hospitals = await this.find();
    hospitals.forEach(async (hospital) => {
      hospital.available_beds = DEFAULT_AVAILABLE_BEDS;
      await this.save(hospital);
    });
  }

  async getHospitalsWithinRadius(
    startLat: number,
    startLng: number,
    radius: number,
  ) {
    return await this.query(
      `
        SELECT geo_id, name, phone, available_beds, latitude, longitude, emogList, ST_Distance_Sphere(Point(${startLng}, ${startLat}),
        point) as 'distance'
        FROM geohospital
        WHERE ST_Distance_Sphere(POINT(${startLng}, ${startLat}), point) < (${radius})
        order by distance;
      `,
    );
  }

  async getHospitalsWithoutRadius(startLng: number, startLat: number) {
    return await this.query(
      `
          SELECT geo_id, name, phone, available_beds, latitude, longitude, emogList, ST_Distance_Sphere(Point(${startLng}, ${startLat}),
          point) as 'distance'
          FROM geohospital
          order by distance;
      `,
    );
  }

  //harversine
  async ConvertRadians(degree: number) {
    return degree * (Math.PI / 180);
  }
  async arcLength(φ1: number, φ2: number, Δφ: number, Δλ: number) {
    const arcLength =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return arcLength;
  }
  async centralAngle(arcLength: number) {
    const centralAngle =
      2 * Math.atan2(Math.sqrt(arcLength), Math.sqrt(1 - arcLength));
    return centralAngle;
  }
}
