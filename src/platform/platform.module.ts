import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformCompaniesController } from './companies/platform-companies.controller';
import { PlatformCompaniesService } from './companies/platform-companies.service';
import { PlatformUsersController } from './users/platform-users.controller';
import { PlatformUsersService } from './users/platform-users.service';
import { PlatformAuditLogsController } from './audit-logs/platform-audit-logs.controller';
import { PlatformAuditLogsService } from './audit-logs/platform-audit-logs.service';
import { PlatformRolesGuard } from './guards/platform-roles.guard';
import { Company } from '../modules/companies/entities/company.entity';
import { User } from '../modules/users/entities/user.entity';
import { AuditLog } from '../modules/audit-logs/entities/audit-log.entity';
import { CompanyUser } from '../modules/company-users/entities/company-user.entity';
import { UsersModule } from '../modules/users/users.module';
import { AuditLogsModule } from '../modules/audit-logs/audit-logs.module';
import { PlatformDashboardController } from './dashboard/platform-dashboard.controller';
import { PlatformDashboardService } from './dashboard/platform-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, CompanyUser, AuditLog]),
    UsersModule,
    AuditLogsModule,
  ],
  controllers: [
    PlatformCompaniesController,
    PlatformUsersController,
    PlatformAuditLogsController,
    PlatformDashboardController,
  ],
  providers: [
    PlatformCompaniesService,
    PlatformUsersService,
    PlatformAuditLogsService,
    PlatformDashboardService,
    PlatformRolesGuard,
  ],
})
export class PlatformModule {}

