import { AuditAction, AuditEntityType, AuditMetadata } from '../entities/audit-log.entity';

export class AuditLogResponseDto {
  id: string;
  createdAt: Date;
  companyId: string;
  actorUserId: string | null;
  actorMembershipId: string | null;
  action: AuditAction | string;
  entityType: AuditEntityType | string;
  entityId: string | null;
  metadata: AuditMetadata | null;
}

export class PaginatedAuditLogsResponseDto {
  data: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
}

