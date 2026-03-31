import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Company, CompanyStatus } from '../../modules/companies/entities/company.entity';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../../modules/company-users/entities/company-user.entity';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { PlatformCompanyDetailDto, PlatformCompanyListItemDto } from './dto/platform-company-response.dto';
import { ListPlatformCompaniesQueryDto } from './dto/list-platform-companies-query.dto';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';
import { AuditAction, AuditEntityType } from '../../modules/audit-logs/entities/audit-log.entity';
import {
  assertValidCompanyStatusTransition,
  auditActionForCompanyStatusTransition,
} from './company-status-lifecycle';
import { OnboardPlatformCompanyRequestDto } from './dto/onboard-platform-company.dto';
import { OnboardPlatformCompanyResponseDto } from './dto/onboard-platform-company-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PlatformCompaniesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Company)
    private readonly companiesRepo: Repository<Company>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async onboardCompany(
    actorUserId: string,
    dto: OnboardPlatformCompanyRequestDto,
  ): Promise<OnboardPlatformCompanyResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const companyRepo = manager.getRepository(Company);
      const userRepo = manager.getRepository(User);
      const companyUserRepo = manager.getRepository(CompanyUser);

      const ownerEmail = dto.initialOwner.email.trim().toLowerCase();

      const existing = await userRepo
        .createQueryBuilder('user')
        .where('LOWER(user.email) = :email', { email: ownerEmail })
        .getOne();

      if (existing) {
        throw new ConflictException(
          'Initial owner email already exists. Linking existing users is not supported in MVP onboarding.',
        );
      }

      const company = companyRepo.create({
        name: dto.company.name.trim(),
        companyCode: dto.company.shortName?.trim() || undefined,
        authorizedCapital: dto.company.authorizedCapital,
        registrationNumber:
          dto.company.registrationNumber?.trim() || this.generateRegistrationNumber(),
        status: CompanyStatus.ACTIVE,
        parValue: 1,
      });
      const savedCompany = await companyRepo.save(company);

      const passwordHash = await bcrypt.hash(dto.initialOwner.password, 10);

      const ownerUser = userRepo.create({
        fullName: dto.initialOwner.fullName.trim(),
        email: ownerEmail,
        phone: dto.initialOwner.phoneNumber?.trim() || undefined,
        passwordHash,
        role: UserRole.COMPANY_ADMIN,
        company: savedCompany,
      });
      const savedOwnerUser = await userRepo.save(ownerUser);

      const membership = companyUserRepo.create({
        companyId: savedCompany.id,
        userId: savedOwnerUser.id,
        role: CompanyUserRole.OWNER,
        status: CompanyUserStatus.ACTIVE,
        invitedByUserId: null,
        joinedAt: new Date(),
      });
      const savedMembership = await companyUserRepo.save(membership);

      await this.auditLogs.logPlatformInTransaction(manager, {
        companyId: savedCompany.id,
        actorUserId,
        action: AuditAction.COMPANY_ONBOARDED,
        entityType: AuditEntityType.COMPANY,
        entityId: savedCompany.id,
        metadata: {
          companyId: savedCompany.id,
          ownerUserId: savedOwnerUser.id,
          ownerEmail,
          ownerRole: CompanyUserRole.OWNER,
        },
      });

      await this.auditLogs.logPlatformInTransaction(manager, {
        companyId: savedCompany.id,
        actorUserId,
        action: AuditAction.MEMBER_ADDED,
        entityType: AuditEntityType.COMPANY_USER,
        entityId: savedMembership.id,
        metadata: {
          companyId: savedCompany.id,
          userId: savedOwnerUser.id,
          role: CompanyUserRole.OWNER,
          status: CompanyUserStatus.ACTIVE,
        },
      });

      return {
        company: {
          id: savedCompany.id,
          name: savedCompany.name,
          status: savedCompany.status,
          authorizedCapital: Number(savedCompany.authorizedCapital),
          createdAt: savedCompany.createdAt,
        },
        initialOwner: {
          userId: savedOwnerUser.id,
          fullName: savedOwnerUser.fullName,
          email: savedOwnerUser.email,
          role: CompanyUserRole.OWNER,
        },
      };
    });
  }

  async list(
    query: ListPlatformCompaniesQueryDto,
  ): Promise<{ data: PlatformCompanyListItemDto[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.companiesRepo
      .createQueryBuilder('company')
      .orderBy('company.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('company.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('company.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    const [entities, total] = await qb.getManyAndCount();

    const data: PlatformCompanyListItemDto[] = entities.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return { data, total, page, limit };
  }

  async getById(id: string): Promise<PlatformCompanyDetailDto> {
    const company = await this.companiesRepo.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return {
      id: company.id,
      name: company.name,
      status: company.status,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      authorizedCapital: Number(company.authorizedCapital),
      suspendedAt: company.suspendedAt,
      suspendedByUserId: company.suspendedByUserId,
      suspensionReason: company.suspensionReason,
    };
  }

  async updateStatus(
    actorUserId: string,
    companyId: string,
    dto: UpdateCompanyStatusDto,
  ): Promise<PlatformCompanyDetailDto> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Company);
      const company = await repo.findOne({ where: { id: companyId } });
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const previousStatus = company.status;
      const reasonNormalized =
        dto.reason === undefined || dto.reason === null
          ? null
          : dto.reason.trim();

      assertValidCompanyStatusTransition(previousStatus, dto.status);

      if (
        dto.status === CompanyStatus.SUSPENDED &&
        !reasonNormalized
      ) {
        throw new BadRequestException(
          'Reason is required when suspending a company',
        );
      }

      company.status = dto.status;

      if (dto.status === CompanyStatus.SUSPENDED) {
        company.suspendedAt = new Date();
        company.suspendedByUserId = actorUserId;
        company.suspensionReason = reasonNormalized;
      } else {
        company.suspendedAt = null;
        company.suspendedByUserId = null;
        company.suspensionReason = null;
      }

      const saved = await repo.save(company);

      const auditAction = auditActionForCompanyStatusTransition(
        previousStatus,
        saved.status,
      );

      await this.auditLogs.logPlatformInTransaction(manager, {
        companyId: saved.id,
        actorUserId,
        action: auditAction,
        entityType: AuditEntityType.COMPANY,
        entityId: saved.id,
        metadata: {
          previousStatus,
          newStatus: saved.status,
          reason: reasonNormalized,
        },
      });

      return {
        id: saved.id,
        name: saved.name,
        status: saved.status,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
        authorizedCapital: Number(saved.authorizedCapital),
        suspendedAt: saved.suspendedAt,
        suspendedByUserId: saved.suspendedByUserId,
        suspensionReason: saved.suspensionReason,
      };
    });
  }

  private generateRegistrationNumber(): string {
    return `AUTO-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }
}

