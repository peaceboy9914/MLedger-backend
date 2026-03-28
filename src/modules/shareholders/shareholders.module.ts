import { Module } from '@nestjs/common';
import { ShareholdersService } from './shareholders.service';
import { ShareholdersController } from './shareholders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shareholder } from './entities/shareholder.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CompanyUsersModule } from '../company-users/company-users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shareholder]),
    AuditLogsModule,
    CompanyUsersModule,
  ],
  providers: [ShareholdersService],
  controllers: [ShareholdersController]
})
export class ShareholdersModule {}
