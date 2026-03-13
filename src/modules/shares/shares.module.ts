import { Module } from '@nestjs/common';
import { SharesService } from './shares.service';
import { SharesController } from './shares.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CapTableModule } from '../cap-table/cap-table.module';

@Module({
  imports: [AuditLogsModule, CapTableModule],
  providers: [SharesService],
  controllers: [SharesController]
})
export class SharesModule {}
