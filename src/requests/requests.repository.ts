import { Repository, DataSource, Like, Brackets } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Reports } from '../reports/reports.entity';

@Injectable()
export class RequestsRepository extends Repository<Reports> {
  constructor(private dataSource: DataSource) {
    super(Reports, dataSource.createEntityManager());
  }

  async getSearchRequests(queries: string[]): Promise<Reports[]> {
    // queries['symptom_level']
    // queries['symptoms'] // 여러개
    // queries['date'] // 범위
    // queries['hospital']
    // const allReports = await this.find({
    //   where: {
    //     symptom_level: queries['symptom_level'],
    //     symptoms: Like(`%${queries['symptoms']}%`),
    //     createdAt: queries['date'],
    //     hospital: queries['hospital'],
    //   },
    // });
    
    // const allReports = await this.createQueryBuilder()
    //     .where('symptom_level = :symptom_level', { symptom_level: queries['symptom_level'] })
    //     .andWhere('symptoms = :symptoms', { symptoms: queries['symptoms'].map((query) => ({symptoms: `%${query}%`}))  })
    //     .andWhere('createdAt = :createdAt', { createdAt: queries['date'] })
    //     // .andWhere('hospital = :hospital', { hospital: queries['hospital'] })
    //     .getRawMany();

    let query = this.createQueryBuilder('reports')
                    // .select('reports')
                    // .from(Reports, 'reports')
                    .leftJoinAndSelect('reports.hospital', 'hospital')
                    .where('1 = 1')
    
    if (queries['date']) { // URL 쿼리에 날짜가 존재하면 실행
      const dates = queries['date'].split('~');
      await query.andWhere(
          new Brackets((qb) => {
              // symptoms.forEach((symptom: string) => {
              //   qb.andWhere(`reports.symptoms LIKE '%${symptom}%'`)
              // })
              qb.andWhere(`reports.createdAt BETWEEN '${dates[0]}' AND '${dates[1]}'`)
          })
      );
    };

    if (queries['symptoms']) { // URL 쿼리에 증상이 존재하면 실행
      const symptoms = queries['symptoms'].split(' ');
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
