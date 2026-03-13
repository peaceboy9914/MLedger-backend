import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CapTableService } from './cap-table.service';
import { ShareTransaction } from '../share-transactions/entities/share-transaction.entity';
import { Company } from '../companies/entities/company.entity';
import { Shareholder } from '../shareholders/entities/shareholder.entity';

describe('CapTableService', () => {
  let service: CapTableService;
  let shareTransactionRepo: jest.Mocked<Repository<ShareTransaction>>;
  let companyRepo: jest.Mocked<Repository<Company>>;
  let shareholderRepo: jest.Mocked<Repository<Shareholder>>;

  const companyId = 'company-uuid';

  beforeEach(async () => {
    const mockShareTransactionRepo = {
      createQueryBuilder: jest.fn(),
    };
    const mockCompanyRepo = {
      createQueryBuilder: jest.fn(),
    };
    const mockShareholderRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CapTableService,
        {
          provide: getRepositoryToken(ShareTransaction),
          useValue: mockShareTransactionRepo,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepo,
        },
        {
          provide: getRepositoryToken(Shareholder),
          useValue: mockShareholderRepo,
        },
      ],
    }).compile();

    service = module.get<CapTableService>(CapTableService);
    shareTransactionRepo = module.get(getRepositoryToken(ShareTransaction));
    companyRepo = module.get(getRepositoryToken(Company));
    shareholderRepo = module.get(getRepositoryToken(Shareholder));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCapTable', () => {
    it('should throw NotFoundException when company does not exist', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        getExists: jest.fn().mockResolvedValue(false),
      };
      companyRepo.createQueryBuilder.mockReturnValue(qb as never);

      await expect(service.getCapTable(companyId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return cap table with balances and ownership percentages', async () => {
      const existsQb = {
        where: jest.fn().mockReturnThis(),
        getExists: jest.fn().mockResolvedValue(true),
      };
      companyRepo.createQueryBuilder.mockReturnValue(existsQb as never);

      const totalIssuedQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '100' }),
      };
      const receivedQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { shareholderId: 'sh1', received: '60' },
          { shareholderId: 'sh2', received: '40' },
        ]),
      };
      const sentQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { shareholderId: 'sh1', sent: '10' },
        ]),
      };

      let txCallCount = 0;
      shareTransactionRepo.createQueryBuilder.mockImplementation(() => {
        txCallCount++;
        if (txCallCount === 1) return totalIssuedQb as never;
        if (txCallCount === 2) return receivedQb as never;
        return sentQb as never;
      });

      shareholderRepo.find.mockResolvedValue([
        { id: 'sh1', fullName: 'Alice', email: 'alice@example.com' },
        { id: 'sh2', fullName: 'Bob', email: 'bob@example.com' },
      ]);

      const result = await service.getCapTable(companyId);

      expect(result).toHaveLength(2);
      const sh1 = result.find((e) => e.shareholderId === 'sh1');
      const sh2 = result.find((e) => e.shareholderId === 'sh2');
      expect(sh1).toEqual({
        shareholderId: 'sh1',
        name: 'Alice',
        email: 'alice@example.com',
        shares: 50,
        ownershipPercentage: 50,
      });
      expect(sh2).toEqual({
        shareholderId: 'sh2',
        name: 'Bob',
        email: 'bob@example.com',
        shares: 40,
        ownershipPercentage: 40,
      });
    });
  });
});
