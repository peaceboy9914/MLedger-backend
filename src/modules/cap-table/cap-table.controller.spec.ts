import { Test, TestingModule } from '@nestjs/testing';
import { CapTableController } from './cap-table.controller';
import { CapTableService } from './cap-table.service';

describe('CapTableController', () => {
  let controller: CapTableController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CapTableController],
      providers: [
        {
          provide: CapTableService,
          useValue: { getCapTable: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<CapTableController>(CapTableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
