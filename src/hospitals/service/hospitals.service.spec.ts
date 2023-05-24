import { Test, TestingModule } from '@nestjs/testing';
import { HospitalsService } from './hospitals.service';

describe('HospitalsService', () => {
  let service: HospitalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HospitalsService],
    }).compile();

    service = module.get<HospitalsService>(HospitalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
