import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from 'src/commons/exceptions/http-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
  });

  // 유저 플로우
  // 1. 증상 보고서 입력 /report
  // 2. 병원 조회 /hospital
  // 3. 환자 이송 신청 /request/:report_id/:hospital_id
  // 4. 증상 보고서 환자 정보 업데이트 /report/:report_id
  // 5. 증상 보고서 검색 및 리스트 조회 /request/search
  // 6. 증상 보고서 상세 조회 /report/:report_id

  // 1. 증상 보고서 입력
  describe('/report (POST)', () => {
    it('201 증상 보고서 입력 성공', () => {
      return request(app.getHttpServer())
        .post('/report')
        .send({
          symptoms: "['두통', '발열', '오한', '피로']",
          symptom_level: 2,
        })
        .expect(201)
        .expect('Hello World!');
    });

    it('412 Validation Error: body data 형식이 맞지 않을 때', () => {
      return request(app.getHttpServer())
        .post('/report')
        .send({
          symptoms: 0,
          symptom_level: '레벨',
        })
        .expect(412);
    });
  });

  // 2. 병원 조회
  describe('/hospital (GET)', () => {
    it('200 병원 조회 성공', () => {
      return request(app.getHttpServer()).get('/hospital').expect(200);
    });
  });

  // 3. 환자 이송 신청
  describe('/request/:report_id/:hospital_id (POST)', () => {
    it('201 이송 신청 성공', () => {
      return request(app.getHttpServer()).post('/request/1/1').expect(201);
    });

    it('404 NotFoundException: 해당 병원이 없을 때', () => {
      return request(app.getHttpServer()).post('/request/1/100000').expect(404);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때', () => {
      return request(app.getHttpServer()).post('/request/100000/1').expect(404);
    });

    it('400 BAD_REQUEST: 이미 증상 보고서를 전송하였을 때', () => {
      return request(app.getHttpServer()).post('/request/1/1').expect(400);
    });

    it('503 SERVICE_UNAVAILABLE: 해당 병원의 병상이 다 찼을 때', () => {
      return request(app.getHttpServer()).post('/request/1/2').expect(503);
    });
  });

  // 4. 증상 보고서 환자 정보 업데이트
  describe('/report/:report_id (PATCH)', () => {
    it('200 환자 정보 업데이트 성공', () => {
      return request(app.getHttpServer())
        .patch('/report/1')
        .send({
          name: '김철수',
          age: 20,
          gender: 'M',
          blood_type: 'A',
        })
        .expect(200);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때', () => {
      return request(app.getHttpServer()).patch('/request/100000').expect(404);
    });
  });

  // 5. 증상 보고서 검색 및 리스트 조회
  describe('/report/search (GET)', () => {
    it('200 검색 성공', () => {
      return request(app.getHttpServer()).get('/report/search').expect(200);
    });
  });

  // 6. 증상보고서 상세 조회
  describe('/report/:report_id (GET)', () => {
    it('200 상세 조회 성공', () => {
      return request(app.getHttpServer()).get('/report/1').expect(200);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때', () => {
      return request(app.getHttpServer()).get('/report/100000').expect(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
