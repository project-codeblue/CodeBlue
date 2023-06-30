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

  // hospital_id로 해당 병원 조회
  async findHospital(hospital_id: number): Promise<Hospitals> {
    const hospital = await this.query(
      `
        SELECT * FROM hospitals WHERE hospital_id = ${hospital_id}
      `,
    );
    return hospital[0];
  }

  // 해당 hospital_id를 가진 병원의 가용 병상 수 1 감소
  async decreaseAvailableBeds(hospital_id: number): Promise<void> {
    await this.query(
      `
        UPDATE hospitals SET available_beds = available_beds - 1 WHERE hospital_id = ${hospital_id};
      `,
    );
  }

  // 해당 hospital_id를 가진 병원의 가용 병상 수 1 증가
  async increaseAvailableBeds(hospital_id: number): Promise<void> {
    await this.query(
      `
        UPDATE hospitals SET available_beds = available_beds + 1 WHERE hospital_id = ${hospital_id};
      `,
    );
  }

  // 1시간마다 default 값을 가지지 않은 병원들의 가용 병상 수를 초기화
  @Cron(CronExpression.EVERY_HOUR)
  async setDefaultAvailableBeds(): Promise<void> {
    const beds = DEFAULT_AVAILABLE_BEDS;
    await this.query(
      `
        UPDATE hospitals SET available_beds = ${beds}
        WHERE available_beds != ${beds};
      `,
    );
  }

  // 반경 내 병원 조회
  async getHospitalsWithinRadius(
    startLat: number,
    startLng: number,
    radius: number,
  ) {
    return await this.query(
      `
        SELECT hospital_id, name, address, phone, available_beds, latitude, longitude, emogList, ST_Distance_Sphere(Point(${startLng}, ${startLat}),
        point) as 'distance'
        FROM hospitals
        WHERE ST_Distance_Sphere(POINT(${startLng}, ${startLat}), point) < (${radius})
        order by distance;
      `,
    );
  }

  // 반경 없이 병원 조회
  async getHospitalsWithoutRadius(startLng: number, startLat: number) {
    return await this.query(
      `
          SELECT hospital_id, name, address, phone, available_beds, latitude, longitude, emogList, ST_Distance_Sphere(Point(${startLng}, ${startLat}),
          point) as 'distance'
          FROM hospitals
          order by distance;
      `,
    );
  }
}
