import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Hospitals } from './hospitals.entity';
import { Reports } from 'src/reports/reports.entity';

@Injectable()
export class HospitalsRepository extends Repository<Hospitals> {
  constructor(
    private dataSource: DataSource, //데이터 베이스 연결
    private reportsRepository: Repository<Reports>,
    private hospitalsRepository: Repository<Hospitals>,
  ) {
    super(Hospitals, dataSource.createEntityManager());
  }

  // async getHospitals(): Promise<Hospitals[]> {
  //   return await this.find();
  // }

  //>>> A*알고리즘 <<<//
  //  일단 패스

  async findReport(report_id: number): Promise<Reports> {
    return await this.reportsRepository.findOne({where:{report_id}});
  }

  //>>> haversine공식 <<<//
  async userLocation(report_id: number): Promise<number[]> {
    //사용자 위치(단일)
    const userInfo: Reports[] = await this.reportsRepository.find();
    const reports: Reports | undefined = userInfo.find(
      (data) => data.report_id === report_id,
    );
    return [reports.latitude, reports.longitude];
  }
  async AllHospitals(): Promise<Hospitals[]> {
    //병원 위치(복수)
    return this.hospitalsRepository.find();
  }

}
