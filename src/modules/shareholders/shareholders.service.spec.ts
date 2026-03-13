import { Test, TestingModule } from '@nestjs/testing';
import { ShareholdersService } from './shareholders.service';

describe('ShareholdersService', () => {
  let service: ShareholdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShareholdersService],
    }).compile();

    service = module.get<ShareholdersService>(ShareholdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
