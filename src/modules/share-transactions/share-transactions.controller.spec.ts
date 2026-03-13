import { Test, TestingModule } from '@nestjs/testing';
import { ShareTransactionsController } from './share-transactions.controller';

describe('ShareTransactionsController', () => {
  let controller: ShareTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShareTransactionsController],
    }).compile();

    controller = module.get<ShareTransactionsController>(ShareTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
