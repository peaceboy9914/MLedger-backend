import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CapTableService } from './cap-table.service';
import { CapTableController } from './cap-table.controller';
import { CapTableCacheService } from './cap-table-cache.service';
import { CapTableCacheInterceptor } from './cap-table-cache.interceptor';
import { ShareTransaction } from '../share-transactions/entities/share-transaction.entity';
import { Company } from '../companies/entities/company.entity';
import { Shareholder } from '../shareholders/entities/shareholder.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShareTransaction, Company, Shareholder]),
  ],
  providers: [CapTableService, CapTableCacheService, CapTableCacheInterceptor],
  controllers: [CapTableController],
  exports: [CapTableService, CapTableCacheService],
})
export class CapTableModule {}
