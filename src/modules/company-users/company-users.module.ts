import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyUsersService } from './company-users.service';
import { CompanyUsersController } from './company-users.controller';
import { CompanyUser } from './entities/company-user.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyUser, Company, User]),
    forwardRef(() => AuditLogsModule),
    forwardRef(() => CompaniesModule),
  ],
  providers: [CompanyUsersService],
  controllers: [CompanyUsersController],
  exports: [CompanyUsersService],
})
export class CompanyUsersModule {}

