import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/commons/exceptions/http-exception.filter';
import { MysqlConfigProvider } from '../src/commons/providers/typeorm-config.provider';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // test용 DB 연결
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRootAsync({
          useClass: MysqlConfigProvider,
        }), // test db 연결을 위해 import: .env에서 mode === test로 변경해줘야함
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
  });

  // 유저 플로우
  // 1. 증상 보고서 입력 /report
  // 2. 병원 조회 /hospital/:report_id
  // 3. 환자 이송 신청 /request/:report_id/:hospital_id
  // 4. 증상 보고서 검색 및 리스트 조회 /request/search
  // 5. 증상 보고서 상세 조회 /report/:report_id
  // 6. 증상 보고서 환자 정보 업데이트 /report/:report_id

  // 1. 증상 보고서 입력
  describe('/report', () => {
    it('201 증상 보고서 입력 성공 (POST)', () => {
      return request(app.getHttpServer())
        .post('/report')
        .send({
          symptoms: '소실된 의식,심부전,사지 마비',
          name: '김철수',
        })
        .expect(201);
    });

    // it('412 Validation Error: body data 형식이 맞지 않을 때 (POST)', () => {
    //   return request(app.getHttpServer())
    //     .post('/report')
    //     .send({
    //       symptoms: 0,
    //       symptom_level: '레벨',
    //     })
    //     .expect(412);
    // });
  });

  // 2. 병원 조회
  describe('/hospital/:report_id', () => {
    it('200 병원 조회 성공 (GET)', () => {
      return request(app.getHttpServer()).get('/hospital/1').expect(200);
    });
  });

  // 3. 환자 이송 신청
  describe('/request/:report_id/:hospital_id (POST)', () => {
    it('201 이송 신청 성공 (GET)', () => {
      return request(app.getHttpServer()).post('/request/1/1').expect(201);
    });

    it('404 NotFoundException: 해당 병원이 없을 때 (GET)', () => {
      return request(app.getHttpServer()).post('/request/1/100000').expect(404);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때 (GET)', () => {
      return request(app.getHttpServer()).post('/request/100000/1').expect(404);
    });

    it('400 BAD_REQUEST: 이미 증상 보고서를 전송하였을 때 (GET)', () => {
      return request(app.getHttpServer()).post('/request/1/1').expect(400);
    });

    it('503 SERVICE_UNAVAILABLE: 해당 병원의 병상이 다 찼을 때 (GET)', () => {
      return request(app.getHttpServer()).post('/request/1/2').expect(503);
    });
  });

  // 4. 증상 보고서 검색 및 리스트 조회
  describe('/report/search', () => {
    it('200 검색 성공 (GET)', () => {
      return request(app.getHttpServer()).get('/report/search').expect(200);
    });
  });

  // 5. 증상보고서 상세 조회
  // 6. 증상 보고서 환자 정보 업데이트
  describe('/report/:report_id', () => {
    it('200 상세 조회 성공 (GET)', () => {
      return request(app.getHttpServer()).get('/report/1').expect(200);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때 (GET)', () => {
      return request(app.getHttpServer()).get('/report/100000').expect(404);
    });

    it('200 환자 정보 업데이트 성공 (PATCH)', () => {
      return request(app.getHttpServer())
        .patch('/report/1')
        .send({
          name: '김영희',
          age: 20,
          gender: 'W',
          blood_type: 'A',
        })
        .expect(200);
    });

    it('404 NotFoundException: 해당 증상 보고서가 없을 때 (PATCH)', () => {
      return request(app.getHttpServer()).patch('/request/100000').expect(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
