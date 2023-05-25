import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHello', () => {
    it('should return "typeorm in nest, just coding"', () => {
      const result = appController.getHello();
      expect(result).toEqual('typeorm in nest, just coding');
    });
  });
});
