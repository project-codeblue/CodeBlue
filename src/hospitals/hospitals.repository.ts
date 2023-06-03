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
    return await this.query(
      `
        SELECT * FROM hospitals;
      `
    );
  }

  async findHospital(hospital_id: number): Promise<Hospitals> {
    return await this.query(
      `
        SELECT * FROM hospitals WHERE hospital_id = ${hospital_id}
      `
    );
  }

  async updateAvailableBeds(hospital_id: number): Promise<void> {
    await this.query(
      `
        UPDATE hospitals SET available_beds = avalable - 1 WHERE hospital_id = ${hospital_id};
      `
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async setDefaultAvailableBeds(): Promise<void> {
    const beds = DEFAULT_AVAILABLE_BEDS;
    await this.query(
      `
        UPDATE hospitals SET available_beds = ${beds};
      `
    );
  }

  async getHospitalsWithinRadius(
    startLat: number,
    startLng: number,
    radius: number,
  ) {
    return await this.query(
      `
        SELECT hospital_id, name, phone, available_beds, latitude, longitude, emogList, ST_Distance_Sphere(Point(${startLng}, ${startLat}),
        point) as 'distance'
        FROM hospitals
        WHERE ST_Distance_Sphere(POINT(${startLng}, ${startLat}), point) < (${radius})
        order by distance;
      `,
    );
  }

  async getHospitalsWithoutRadius(startLng: number, startLat: number) {
    return await this.query(
      `
          SELECT hospital_id, name, phone, available_beds, latitude, longitude, emogList, ST_Distance_Sphere(Point(${startLng}, ${startLat}),
          point) as 'distance'
          FROM hospitals
          order by distance;
      `,
    );
  }
}
