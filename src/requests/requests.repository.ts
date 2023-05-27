import { Repository, DataSource, Like, Brackets } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Reports } from '../reports/reports.entity';

@Injectable()
export class RequestsRepository extends Repository<Reports> {
  constructor(private dataSource: DataSource) {
    super(Reports, dataSource.createEntityManager());
  }

  async getSearchRequests(queries: string[]): Promise<Reports[]> {
    let query = this.createQueryBuilder('reports')
                    .leftJoinAndSelect('reports.hospital', 'hospital')
                    .where('1 = 1')
                    .where('is_sent = 1')
    
    if (queries['date']) { // URL 쿼리에 날짜가 존재하면 실행
      const dates = queries['date'].split('~'); // '~' 를 기준으로 날짜 범위 구분
      await query.andWhere(
        new Brackets((qb) => {
          qb.andWhere(`reports.createdAt BETWEEN '${dates[0]}' AND '${dates[1]}'`)
        })
      );
    };

    if (queries['symptoms']) { // URL 쿼리에 증상이 존재하면 실행
      const symptoms = queries['symptoms'].split(' '); // 공백을 기준으로 증상 구분
      symptoms.forEach((symptom: string) => {
        query.andWhere(`reports.symptoms LIKE '%${symptom}%'`)
      });
    };
    
    if (queries['symptom_level']) { // URL 쿼리에 증상도가 존재하면 실행
      query.andWhere(`reports.symptom_level = ${queries['symptom_level']}`)
    };
    
    const allReports = query.getRawMany();

    return allReports;
  }
}
