import { Module, forwardRef } from '@nestjs/common';
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
import { CompanyActiveGuard } from './guards/company-active.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, Shareholder, CompanyUser]),
    forwardRef(() => CompanyUsersModule),
    AuditLogsModule,
    CapTableModule,
  ],
  providers: [CompaniesService, CompanyActiveGuard],
  controllers: [CompaniesController, MeCompaniesController],
  // Re-export TypeOrmModule so CompanyActiveGuard’s @InjectRepository(Company) resolves in
  // consumer modules (ShareholdersModule, SharesModule, CompanyUsersModule).
  exports: [TypeOrmModule, CompanyActiveGuard],
})
export class CompaniesModule {}