import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Shareholder } from '../shareholders/entities/shareholder.entity';
import { CompanyUser } from '../company-users/entities/company-user.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { MeCompaniesController } from './me-companies.controller';
import { CompanyUsersModule } from '../company-users/company-users.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CapTableModule } from '../cap-table/cap-table.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, Shareholder, CompanyUser]),
    CompanyUsersModule,
    AuditLogsModule,
    CapTableModule,
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController, MeCompaniesController],
})
export class CompaniesModule {}