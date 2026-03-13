import { Test, TestingModule } from '@nestjs/testing';
import { ShareholdersController } from './shareholders.controller';

describe('ShareholdersController', () => {
  let controller: ShareholdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShareholdersController],
    }).compile();

    controller = module.get<ShareholdersController>(ShareholdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
