import { Test, TestingModule } from '@nestjs/testing';
import { ShareTransactionsService } from './share-transactions.service';

describe('ShareTransactionsService', () => {
  let service: ShareTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShareTransactionsService],
    }).compile();

    service = module.get<ShareTransactionsService>(ShareTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
