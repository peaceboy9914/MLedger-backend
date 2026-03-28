import { Module } from '@nestjs/common';
import { SharesService } from './shares.service';
import { SharesController } from './shares.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CapTableModule } from '../cap-table/cap-table.module';
import { CompanyUsersModule } from '../company-users/company-users.module';

@Module({
  imports: [AuditLogsModule, CapTableModule, CompanyUsersModule],
  providers: [SharesService],
  controllers: [SharesController]
})
export class SharesModule {}
