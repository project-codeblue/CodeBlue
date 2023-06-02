import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/commons/exceptions/http-exception.filter';
import { MysqlConfigProvider } from '../src/commons/providers/typeorm-config.provider';
import { Hospitals } from '../src/hospitals/hospitals.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let hospitalsRepository: Repository<Hospitals>; // Hospitals 데이터를 추가해주는 POST API는 존재하지 않고, DB에 미리 저장해놓기 때문에 직접 db에 접근하기 위해 추가

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

    // 병원 미리 추가해주기
    hospitalsRepository = moduleFixture.get('HospitalsRepository');
    await hospitalsRepository.query(`
      INSERT INTO hospitals (name, address, phone, available_beds, latitude, longitude)
      VALUES ('가톨릭대학교여의도성모병원', '서울특별시 영등포구 63로 10, 여의도성모병원 (여의도동)', '02-3779-1188', 10, 37.51827233800711, 126.93673129599131);
    `); // 가용 병상이 있는 병원
    await hospitalsRepository.query(`
      INSERT INTO hospitals (name, address, phone, available_beds, latitude, longitude)
      VALUES ('가톨릭대학교여의도성모병원', '서울특별시 영등포구 63로 10, 여의도성모병원 (여의도동)', '02-3779-1188', 0, 37.51827233800711, 126.93673129599131);
    `); // 가용 병상이 없는 병원
  });

  // 어플리케이션 동작 과정
  // 0. 병원 데이터 추가 /hospital
  // 유저 플로우
  // 1. 증상 보고서 입력 /report
  // 2. 병원 조회 /hospital/:report_id
  // 3. 환자 이송 신청 /request/:report_id/:hospital_id
  // 4. 증상 보고서 검색 및 리스트 조회 /request/search
  // 5. 증상 보고서 상세 조회 /report/:report_id
  // 6. 증상 보고서 환자 정보 업데이트 /report/:report_id

  // 1. 증상 보고서 입력
  describe('/report', () => {
    it('201 증상 보고서 입력 성공 - 환자 정보 없이, 증상만 입력 (POST)', () => {
      return request(app.getHttpServer())
        .post('/report')
        .send({
          symptoms: '소실된 의식,심부전,사지 마비',
        })
        .expect(201);
    });

    it('201 증상 보고서 입력 성공 - 환자 정보 포함 (POST)', () => {
      return request(app.getHttpServer()).post('/report').send({
        symptoms: '소실된 의식,심부전,사지 마비',
        name: '홍길동',
        age: 20,
      });
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
    }); // geohospital table 만드는 거 필요
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
      return request(app.getHttpServer()).post('/request/2/2').expect(503);
    });
  });

  // 4. 증상 보고서 검색 및 리스트 조회
  describe('/report/search', () => {
    it('200 검색 성공 (GET)', () => {
      return request(app.getHttpServer())
        .get('/report/search?symptom_level=2')
        .expect(200);
    });

    it('404 NotFoundException: 검색 결과가 없을 때 (GET)', () => {
      return request(app.getHttpServer())
        .get('/report/search?symptom_level=0')
        .expect(404);
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
    }); // 예외처리 필요

    it('200 환자 정보 업데이트 성공 (PATCH)', () => {
      return request(app.getHttpServer())
        .patch('/report/1')
        .send({
          blood_type: 'A',
          name: '김영희',
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
