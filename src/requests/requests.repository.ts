import { Repository, DataSource, Like, Brackets } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Reports } from '../reports/reports.entity';
import * as date from 'date-and-time';

@Injectable()
export class RequestsRepository extends Repository<Reports> {
  constructor(private dataSource: DataSource) {
    super(Reports, dataSource.createEntityManager());
  }

  async getAllRequests(): Promise<Reports[]> {
    const allReports = await this.find();
    return allReports;
  }

  async getSearchRequests(queries: object): Promise<Reports[]> {
    let query = this.createQueryBuilder('reports')
      .leftJoinAndSelect('reports.hospital', 'hospital')
      .where('1 = 1')
      .where('is_sent = 1');

    if (queries['date']) {
      // URL 쿼리에 날짜가 존재하면 실행
      const dates: string[] = queries['date'].split('~'); // '~' 를 기준으로 날짜 범위 구분

      const regex = /^\d{4}-\d{2}-\d{2}$/;
      for (let date of dates) {
        if(!regex.test(date)) {
          throw new Error('날짜 형식이 맞지 않습니다');
        }
      }

      if (dates.length === 1) {
        const temp = new Date(dates[0]);
        temp.setDate(temp.getDate() + 1);
        dates.push(date.format(temp, 'YYYY-MM-DD'));
      }
      
      await query.andWhere(
        new Brackets((qb) => {
          qb.andWhere(
            `reports.createdAt BETWEEN '${dates[0]}' AND '${dates[1]}'`,
          );
        }),
      );
    }

    if (queries['symptoms']) {
      // URL 쿼리에 증상이 존재하면 실행
      const symptoms = queries['symptoms'].split(','); // 쉼표를 기준으로 증상 구분
      symptoms.forEach((symptom: string) => {
        query.andWhere(`reports.symptoms LIKE '%${symptom}%'`);
      });
    }

    if (queries['symptom_level']) {
      // URL 쿼리에 증상도가 존재하면 실행
      query.andWhere(`reports.symptom_level = ${queries['symptom_level']}`);
    }

    if (queries['site']) {
      // URL 쿼리에 지역이 존재하면 실행
      query.andWhere(`hospital.address LIKE '%${queries['site']}%'`);
    }

    const allReports = query.getRawMany();

    return allReports;
  }
}
