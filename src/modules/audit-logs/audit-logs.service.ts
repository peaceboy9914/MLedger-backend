import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditEntityType, AuditMetadata } from './entities/audit-log.entity';
import type { TenantContext } from '../../common/interfaces/tenant-context.interface';

export interface ListAuditLogsOptions {
  page: number;
  limit: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  companyId?: string;
  from?: Date;
  to?: Date;
}

export interface CreateAuditLogParams {
  tenant: TenantContext;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: AuditMetadata | null;
}

export interface CreatePlatformAuditLogParams {
  companyId: string;
  actorUserId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: AuditMetadata | null;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(params: CreateAuditLogParams): Promise<AuditLog> {
    const { tenant, action, entityType, entityId = null, metadata = null } =
      params;

    const log = this.repo.create({
      companyId: tenant.companyId,
      actorUserId: tenant.userId,
      actorMembershipId: tenant.membershipId,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? null,
    });

    return this.repo.save(log);
  }

  async logPlatform(params: CreatePlatformAuditLogParams): Promise<AuditLog> {
    const { companyId, actorUserId, action, entityType, entityId = null, metadata = null } =
      params;

    const log = this.repo.create({
      companyId,
      actorUserId,
      actorMembershipId: null,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? null,
    });

    return this.repo.save(log);
  }

  async logInTransaction(
    manager: EntityManager,
    params: CreateAuditLogParams,
  ): Promise<AuditLog> {
    const { tenant, action, entityType, entityId = null, metadata = null } =
      params;

    const repo = manager.getRepository(AuditLog);
    const log = repo.create({
      companyId: tenant.companyId,
      actorUserId: tenant.userId,
      actorMembershipId: tenant.membershipId,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? null,
    });

    return repo.save(log);
  }

  async logPlatformInTransaction(
    manager: EntityManager,
    params: CreatePlatformAuditLogParams,
  ): Promise<AuditLog> {
    const { companyId, actorUserId, action, entityType, entityId = null, metadata = null } =
      params;

    const repo = manager.getRepository(AuditLog);
    const log = repo.create({
      companyId,
      actorUserId,
      actorMembershipId: null,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? null,
    });

    return repo.save(log);
  }

  async listForCompany(
    companyId: string,
    options: ListAuditLogsOptions,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const { page, limit, action, entityType, entityId, from, to } = options;

    const qb = this.repo
      .createQueryBuilder('log')
      .where('log.companyId = :companyId', { companyId });

    if (action) {
      qb.andWhere('log.action = :action', { action });
    }
    if (entityType) {
      qb.andWhere('log.entityType = :entityType', { entityType });
    }
    if (entityId) {
      qb.andWhere('log.entityId = :entityId', { entityId });
    }
    if (from) {
      qb.andWhere('log.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('log.createdAt <= :to', { to });
    }

    qb.orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async listAll(
    options: ListAuditLogsOptions,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const { page, limit, action, entityType, entityId, companyId, from, to } =
      options;

    const qb = this.repo.createQueryBuilder('log');

    if (companyId) {
      qb.andWhere('log.companyId = :companyId', { companyId });
    }
    if (action) {
      qb.andWhere('log.action = :action', { action });
    }
    if (entityType) {
      qb.andWhere('log.entityType = :entityType', { entityType });
    }
    if (entityId) {
      qb.andWhere('log.entityId = :entityId', { entityId });
    }
    if (from) {
      qb.andWhere('log.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('log.createdAt <= :to', { to });
    }

    qb.orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }
}

