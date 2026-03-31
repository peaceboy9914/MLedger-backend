import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager } from 'typeorm';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';
import { Company, CompanyStatus } from '../../modules/companies/entities/company.entity';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../../modules/company-users/entities/company-user.entity';
import {
  AuditLog,
  AuditAction,
  AuditEntityType,
  type AuditMetadata,
} from '../../modules/audit-logs/entities/audit-log.entity';
import {
  SEED_COMPANIES,
  SEED_EXTRA_MEMBERS,
  SEED_REGISTRATION,
  SEED_SUPER_ADMIN,
} from './seed-definitions';

export interface SeedRunSummary {
  superAdmin: 'created' | 'skipped';
  companies: { created: number; skipped: number };
  users: { created: number; skipped: number };
  memberships: { created: number; skipped: number };
  auditLogs: { created: number };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class SeedService {
  constructor(private readonly dataSource: DataSource) {}

  async run(): Promise<SeedRunSummary> {
    const summary: SeedRunSummary = {
      superAdmin: 'skipped',
      companies: { created: 0, skipped: 0 },
      users: { created: 0, skipped: 0 },
      memberships: { created: 0, skipped: 0 },
      auditLogs: { created: 0 },
    };

    await this.dataSource.transaction(async (manager) => {
      const superAdmin = await this.ensureSuperAdmin(manager, summary);

      for (const def of SEED_COMPANIES) {
        await this.ensureSeededCompany(manager, def, superAdmin.id, summary);
      }

      const activeCompany = await manager.findOne(Company, {
        where: { registrationNumber: SEED_REGISTRATION.ACTIVE },
      });
      if (activeCompany) {
        for (const member of SEED_EXTRA_MEMBERS) {
          await this.ensureExtraMember(
            manager,
            activeCompany,
            member,
            superAdmin.id,
            summary,
          );
        }
      }
    });

    return summary;
  }

  private async ensureSuperAdmin(
    manager: EntityManager,
    summary: SeedRunSummary,
  ): Promise<User> {
    const email = normalizeEmail(SEED_SUPER_ADMIN.email);
    const userRepo = manager.getRepository(User);
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      return existing;
    }

    const passwordHash = await bcrypt.hash(SEED_SUPER_ADMIN.password, 10);
    const user = userRepo.create({
      fullName: SEED_SUPER_ADMIN.fullName,
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      company: undefined,
    });
    const saved = await userRepo.save(user);
    summary.superAdmin = 'created';
    summary.users.created += 1;
    return saved;
  }

  private async ensureSeededCompany(
    manager: EntityManager,
    def: (typeof SEED_COMPANIES)[number],
    superAdminId: string,
    summary: SeedRunSummary,
  ): Promise<void> {
    const companyRepo = manager.getRepository(Company);
    const existingCompany = await companyRepo.findOne({
      where: { registrationNumber: def.registrationNumber },
    });
    if (existingCompany) {
      summary.companies.skipped += 1;
      return;
    }

    const ownerEmail = normalizeEmail(def.owner.email);
    const userRepo = manager.getRepository(User);
    const existingOwner = await userRepo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: ownerEmail })
      .getOne();
    if (existingOwner) {
      summary.companies.skipped += 1;
      return;
    }

    const { suspendedAt, suspendedByUserId, suspensionReason } =
      this.suspensionFieldsForSeed(def, superAdminId);

    const company = companyRepo.create({
      name: def.name,
      companyCode: def.companyCode?.trim() || undefined,
      registrationNumber: def.registrationNumber,
      authorizedCapital: def.authorizedCapital,
      parValue: 1,
      status: def.status,
      suspendedAt,
      suspendedByUserId,
      suspensionReason,
    });
    const savedCompany = await companyRepo.save(company);
    summary.companies.created += 1;

    const passwordHash = await bcrypt.hash(def.owner.password, 10);
    const ownerUser = userRepo.create({
      fullName: def.owner.fullName.trim(),
      email: ownerEmail,
      phone: def.owner.phone?.trim() || undefined,
      passwordHash,
      role: UserRole.COMPANY_ADMIN,
      company: savedCompany,
    });
    const savedOwner = await userRepo.save(ownerUser);
    summary.users.created += 1;

    const companyUserRepo = manager.getRepository(CompanyUser);
    const membership = companyUserRepo.create({
      companyId: savedCompany.id,
      userId: savedOwner.id,
      role: CompanyUserRole.OWNER,
      status: CompanyUserStatus.ACTIVE,
      invitedByUserId: null,
      joinedAt: new Date(),
    });
    const savedMembership = await companyUserRepo.save(membership);
    summary.memberships.created += 1;

    await this.insertPlatformAudit(manager, {
      companyId: savedCompany.id,
      actorUserId: superAdminId,
      action: AuditAction.COMPANY_ONBOARDED,
      entityType: AuditEntityType.COMPANY,
      entityId: savedCompany.id,
      metadata: {
        source: 'seed',
        registrationNumber: def.registrationNumber,
        status: def.status,
      },
      summary,
    });

    await this.insertPlatformAudit(manager, {
      companyId: savedCompany.id,
      actorUserId: superAdminId,
      action: AuditAction.MEMBER_ADDED,
      entityType: AuditEntityType.COMPANY_USER,
      entityId: savedMembership.id,
      metadata: {
        source: 'seed',
        userId: savedOwner.id,
        ownerEmail,
        role: CompanyUserRole.OWNER,
        status: CompanyUserStatus.ACTIVE,
      },
      summary,
    });

    await this.seedStatusAuditIfNeeded(
      manager,
      savedCompany,
      def.status,
      superAdminId,
      def.suspensionReason ?? null,
      summary,
    );
  }

  private suspensionFieldsForSeed(
    def: (typeof SEED_COMPANIES)[number],
    superAdminId: string,
  ): {
    suspendedAt: Date | null;
    suspendedByUserId: string | null;
    suspensionReason: string | null;
  } {
    if (def.status === CompanyStatus.SUSPENDED) {
      return {
        suspendedAt: new Date(),
        suspendedByUserId: superAdminId,
        suspensionReason: def.suspensionReason ?? 'Suspended (seed)',
      };
    }
    return {
      suspendedAt: null,
      suspendedByUserId: null,
      suspensionReason: null,
    };
  }

  private async seedStatusAuditIfNeeded(
    manager: EntityManager,
    company: Company,
    status: CompanyStatus,
    superAdminId: string,
    suspensionReason: string | null,
    summary: SeedRunSummary,
  ): Promise<void> {
    if (status === CompanyStatus.ACTIVE) {
      return;
    }

    let action: AuditAction;
    switch (status) {
      case CompanyStatus.PENDING_REVIEW:
        action = AuditAction.COMPANY_MARKED_PENDING_REVIEW;
        break;
      case CompanyStatus.SUSPENDED:
        action = AuditAction.COMPANY_SUSPENDED;
        break;
      case CompanyStatus.ARCHIVED:
        action = AuditAction.COMPANY_ARCHIVED;
        break;
      default:
        action = AuditAction.COMPANY_STATUS_UPDATED;
    }

    await this.insertPlatformAudit(manager, {
      companyId: company.id,
      actorUserId: superAdminId,
      action,
      entityType: AuditEntityType.COMPANY,
      entityId: company.id,
      metadata: {
        source: 'seed',
        newStatus: status,
        reason: suspensionReason,
      },
      summary,
    });
  }

  private async ensureExtraMember(
    manager: EntityManager,
    company: Company,
    member: (typeof SEED_EXTRA_MEMBERS)[number],
    superAdminId: string,
    summary: SeedRunSummary,
  ): Promise<void> {
    const email = normalizeEmail(member.email);
    const userRepo = manager.getRepository(User);
    const companyUserRepo = manager.getRepository(CompanyUser);

    let user = await userRepo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email })
      .getOne();

    if (!user) {
      const passwordHash = await bcrypt.hash(member.password, 10);
      user = userRepo.create({
        fullName: member.fullName.trim(),
        email,
        passwordHash,
        role: UserRole.COMPANY_ADMIN,
        company,
      });
      user = await userRepo.save(user);
      summary.users.created += 1;
    } else {
      summary.users.skipped += 1;
    }

    const existingMembership = await companyUserRepo.findOne({
      where: { companyId: company.id, userId: user.id },
    });
    if (existingMembership) {
      summary.memberships.skipped += 1;
      return;
    }

    const membership = companyUserRepo.create({
      companyId: company.id,
      userId: user.id,
      role: member.role,
      status: CompanyUserStatus.ACTIVE,
      invitedByUserId: null,
      joinedAt: new Date(),
    });
    const saved = await companyUserRepo.save(membership);
    summary.memberships.created += 1;

    await this.insertPlatformAudit(manager, {
      companyId: company.id,
      actorUserId: superAdminId,
      action: AuditAction.MEMBER_ADDED,
      entityType: AuditEntityType.COMPANY_USER,
      entityId: saved.id,
      metadata: {
        source: 'seed',
        userId: user.id,
        email,
        role: member.role,
        status: CompanyUserStatus.ACTIVE,
      },
      summary,
    });
  }

  private async insertPlatformAudit(
    manager: EntityManager,
    params: {
      companyId: string;
      actorUserId: string;
      action: AuditAction;
      entityType: AuditEntityType | string;
      entityId: string | null;
      metadata: AuditMetadata | null;
      summary: SeedRunSummary;
    },
  ): Promise<void> {
    const repo = manager.getRepository(AuditLog);
    const log = repo.create({
      companyId: params.companyId,
      actorUserId: params.actorUserId,
      actorMembershipId: null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    });
    await repo.save(log);
    params.summary.auditLogs.created += 1;
  }
}
