import { Test, TestingModule } from '@nestjs/testing';
import { ExtractorsController } from './extractors.controller';
import { ExtractorsService } from './extractors.service';

describe('ExtractorsController', () => {
  let controller: ExtractorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtractorsController],
      providers: [ExtractorsService],
    }).compile();

    controller = module.get<ExtractorsController>(ExtractorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
