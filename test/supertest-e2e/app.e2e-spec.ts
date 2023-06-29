import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/commons/exceptions/http-exception.filter';
import { MysqlConfigProvider } from '../../src/commons/providers/typeorm-config.provider';
import { Hospitals } from '../../src/hospitals/hospitals.entity';
import { BloodType, AgeRange } from '../../src/reports/reports.enum';
import { join } from 'path';

// !!!!!!!! e2e test 전 반드시 .env 파일의 mode를 test로 변경해주어야합니다 !!!!!!!!

/** 
 어플리케이션 동작 과정
 0. 병원 데이터 추가 /hospital
 유저 플로우
 1. 증상 보고서 입력 /report
 2. 환자 정보 입력 /patient/:report_id
 3. 환자 정보 수정 /patient/:patient_id
 4. 병원 조회 /hospital/:report_id
 5. 환자 이송 신청 /request/:report_id/:hospital_id
 6. 증상 보고서 검색 및 리스트 조회 /request/search
 7. 증상 보고서 상세 조회 /report/:report_id
 8. 증상 보고서 수정 /report/:report_id
 9. 환자 이송 신청 철회 /report/:report_id
*/

describe('CodeBLUE E2E Test', () => {
  let app: INestApplication;
  let hospitalsRepository: Repository<Hospitals>; // Hospitals 데이터를 추가해주는 POST API는 존재하지 않고, DB에 미리 저장해놓기 때문에 직접 db에 접근하기 위해 추가

  beforeAll(async () => {
    // test용 DB 연결
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRootAsync({
          useClass: MysqlConfigProvider,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter()); // global filter

    await app.init();

    // 병원 미리 추가해주기
    hospitalsRepository = moduleFixture.get('HospitalsRepository');
    await hospitalsRepository.query(`
      CREATE SPATIAL INDEX spatial_index ON hospitals(point);
    `); // point column에 nullable = false로 설정해주어야함
    await hospitalsRepository.query(`
      INSERT INTO hospitals (name, address, phone, available_beds, latitude, longitude, emogList, point)
      VALUES ('가톨릭대학교여의도성모병원', '서울특별시 영등포구 63로 10, 여의도성모병원 (여의도동)', '02-3779-1188', 10, 37.51827233800711, 126.93673129599131, 'A1100011', POINT(126.93673129599131, 37.51827233800711));
    `); // 가용 병상이 있는 병원
    await hospitalsRepository.query(`
      INSERT INTO hospitals (name, address, phone, available_beds, latitude, longitude, emogList, point)
      VALUES ('강원도강릉의료원', '강원도 강릉시 경강로 2007 (남문동)', '033-610-1200', 0, 37.7493104200, 128.8887963000, 'A2200011', POINT(128.8887963000, 37.7493104200));
    `); // 가용 병상이 없는 병원
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. 증상 보고서 입력
  describe('/report', () => {
    it('201 증상 보고서 입력 성공 - 주민번호 없이 (POST)', () => {
      return request(app.getHttpServer())
        .post('/report')
        .send({
          symptoms:
            '환자의 심장 박동이 중단되었으며, 구급대원이 CPR을 실시 중입니다.',
        })
        .expect(201);
    });

    it('201 증상 보고서 입력 성공 - 주민번호 포함 (POST)', () => {
      return request(app.getHttpServer())
        .post('/report')
        .send({
          symptoms: '환자의 혈압이 급격하게 상승한 것 같습니다.',
          patient_rrn: '000000-3111111',
        })
        .expect(201);
    });
  });

  // 2. 환자 정보 입력
  describe('/patient/:report_id', () => {
    it('201 환자 정보 입력 성공 (POST)', () => {
      return request(app.getHttpServer())
        .post('/patient/1')
        .send({
          name: '홍길동',
          patient_rrn: '000101-1111111',
        })
        .expect(201);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때 (POST)', () => {
      return request(app.getHttpServer())
        .post('/patient/1000000')
        .send({
          name: '홍길동',
          patient_rrn: '000000-3111111',
        })
        .expect(404);
    });
  });

  // 3. 환자 정보 수정
  describe('/patient/:patient_id', () => {
    it('200 환자 정보 수정 성공 (PATCH)', () => {
      return request(app.getHttpServer())
        .patch('/patient/1')
        .send({
          name: '김영희',
        })
        .expect(200);
    });

    it('404 NotFoundException: 해당 환자가 없을 때 (PATCH)', () => {
      return request(app.getHttpServer())
        .patch('/patient/1000000')
        .send({
          name: '김영희',
        })
        .expect(404);
    });
  });

  // 4. 병원 조회
  describe('/hospital/:report_id?latitude=latitude?longitude=longitude', () => {
    it('200 병원 조회 성공 (GET)', () => {
      // 체크
      return request(app.getHttpServer())
        .get('/hospital/1?latitude=37.199188&longitude=127.0722199')
        .expect(200);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때 (GET)', () => {
      return request(app.getHttpServer())
        .get('/hospital/100000?latitude=37.199188&longitude=127.0722199')
        .expect(404);
    });

    it('404 NotFoundException: 사용자가 선택한 반경내에 병원이 없을경우 (GET)', () => {
      return request(app.getHttpServer())
        .get('/hospital/1?latitude=37.199188&longitude=127.0722199&radius=0')
        .expect(404);
    });
  });

  // 5. 환자 이송 신청
  describe('/request/:report_id/:hospital_id (POST)', () => {
    it('201 이송 신청 성공 (POST)', () => {
      return request(app.getHttpServer()).post('/request/1/1').expect(201);
    });

    it('404 NotFoundException: 해당 병원이 없을 때 (POST)', () => {
      return request(app.getHttpServer()).post('/request/1/100000').expect(404);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때 (POST)', () => {
      return request(app.getHttpServer()).post('/request/100000/1').expect(404);
    });

    it('400 BAD_REQUEST: 이미 증상 보고서를 전송하였을 때 (POST)', () => {
      return request(app.getHttpServer()).post('/request/1/1').expect(400);
    });

    it('503 SERVICE_UNAVAILABLE: 해당 병원의 병상이 다 찼을 때 (POST)', () => {
      return request(app.getHttpServer()).post('/request/2/2').expect(503);
    });
  });

  // 6. 증상 보고서 검색 및 리스트 조회
  describe('/request/search', () => {
    it('200 검색 성공 (GET)', () => {
      return request(app.getHttpServer())
        .get('/request/search?symptom_level=1')
        .expect(200);
    });

    it('404 NotFoundException: 검색 결과가 없을 때 (GET)', () => {
      return request(app.getHttpServer())
        .get('/request/search?symptom_level=0')
        .expect(404);
    });
  });

  // 7. 증상 보고서 상세 조회
  // 8. 증상 보고서 수정
  describe('/report/:report_id', () => {
    it('200 상세 조회 성공 (GET)', () => {
      // 체크
      return request(app.getHttpServer()).get('/report/1').expect(200);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때 (GET)', () => {
      return request(app.getHttpServer()).get('/report/100000').expect(404);
    });

    it('200 증상보고서 정보 업데이트 성공 (PATCH)', () => {
      return request(app.getHttpServer())
        .patch('/report/1')
        .send({
          blood_type: BloodType.A,
          blood_pressure: '120/80',
          age_range: AgeRange.임산부,
        })
        .expect(200);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때 (PATCH)', () => {
      return request(app.getHttpServer()).patch('/report/100000').expect(404);
    });
  });

  // 9. 환자 이송 신청 철회 /report/:report_id
  describe('/request/:report_id', () => {
    it('200 이송 신청 철회 성공 (DELETE)', () => {
      return request(app.getHttpServer()).delete('/request/1').expect(200);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때 (DELETE)', () => {
      return request(app.getHttpServer()).delete('/request/100000').expect(404);
    });

    it('400 BAD_REQUEST: 이송 신청하지 않은 증상 보고서일 때 (DELETE)', () => {
      return request(app.getHttpServer()).delete('/request/2').expect(400);
    });
  });
});
