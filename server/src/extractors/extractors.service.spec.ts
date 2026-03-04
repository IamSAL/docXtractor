import { Test, TestingModule } from '@nestjs/testing';
import { ExtractorsService } from './extractors.service';

describe('ExtractorsService', () => {
  let service: ExtractorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExtractorsService],
    }).compile();

    service = module.get<ExtractorsService>(ExtractorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
