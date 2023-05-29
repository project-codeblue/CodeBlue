import { Test, TestingModule } from '@nestjs/testing';
import { HospitalsController } from '../controller/hospitals.controller';
import { HospitalsService } from '../service/hospitals.service';
import { Hospitals } from '../hospitals.entity';

describe('HospitalsController', () => {
  //타입지정
  let hospitalsController: HospitalsController;
  let hospitalsService: HospitalsService;
  beforeEach(async () => {
    const hospitalsServiceMock: Partial<HospitalsService> = {
      //HospitalService에 있는 getHospitals의 타입을 mock함수에 세팅
      getHospitals: jest.fn().mockResolvedValue([]),
    };
    const hospitals: TestingModule = await Test.createTestingModule({
      controllers: [HospitalsController],
      providers: [
        {
          provide: HospitalsService,
          useValue: hospitalsServiceMock, //Nest의 custom provide중 하나
          //provide는 Hospital서비스이지만 그 객체 값은 useValue를 따름(mock함수여서 entitu,데이터베이스 처리 건너뜀)
        },
      ],
    }).compile();

    hospitalsController =
      hospitals.get<HospitalsController>(HospitalsController);
    hospitalsService = hospitals.get<HospitalsService>(HospitalsService);
  });
  describe('Controller: getHospitals', () => {
    it('Controller: 병원 데이터 조회 테스트', async () => {
      const result: Hospitals[] = []; // 타입은 배열이고 반환 값도 배열로 세팅

      (hospitalsService.getHospitals as jest.Mock).mockResolvedValue(result);
      /* as : 타입단언시 사용되는 키워드,hospitalsService.getHospitals를 mock타입으로 선언
              그 덕분에 mockResolvedValure(result)와 같은 jest의 목 메서드를 호출할 수 있음 */
      expect(await hospitalsController.getHospitals()).toBe(result);
    });
  });
});
