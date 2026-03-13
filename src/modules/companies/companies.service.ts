import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Company } from './entities/company.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Shareholder } from '../shareholders/entities/shareholder.entity';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { CompanyListItemDto } from './dto/company-list-item.dto';
import { CompanyOnboardResponseDto } from './dto/company-onboard-response.dto';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../company-users/entities/company-user.entity';
import { CompanyUsersService } from '../company-users/company-users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditEntityType } from '../audit-logs/entities/audit-log.entity';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';

@Injectable()
export class CompaniesService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(Company)
    private companyRepository: Repository<Company>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Shareholder)
    private shareholderRepository: Repository<Shareholder>,

    @InjectRepository(CompanyUser)
    private companyUserRepository: Repository<CompanyUser>,

    private readonly companyUsersService: CompanyUsersService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async createCompanyWithAdmin(
    dto: CreateCompanyWithAdminDto,
  ): Promise<CompanyOnboardResponseDto> {
    const { initiatedByUserId, ...rest } = dto;

    return this.dataSource.transaction(async (manager) => {
      // 1️⃣ Check if email already exists
      const existingUser = await manager.findOne(User, {
        where: { email: dto.adminEmail },
      });

      if (existingUser) {
        throw new BadRequestException('Admin email already exists');
      }

      // 2️⃣ Create company
      const company = manager.create(Company, {
        name: rest.companyName,
        registrationNumber: rest.registrationNumber,
        authorizedCapital: rest.authorizedCapital,
        parValue: 1,
      });

      const savedCompany = await manager.save(company);

      // 3️⃣ Hash password
      const hashedPassword = await bcrypt.hash(rest.adminPassword, 10);

      // 4️⃣ Create Company Admin
      const adminUser = manager.create(User, {
        fullName: rest.adminFullName,
        email: rest.adminEmail,
        passwordHash: hashedPassword,
        role: UserRole.COMPANY_ADMIN,
        company: savedCompany,
      });

      const savedAdminUser = await manager.save(adminUser);

      // 5️⃣ Create initial company membership (OWNER + ACTIVE)
      const membership = manager.create(CompanyUser, {
        companyId: savedCompany.id,
        userId: savedAdminUser.id,
        role: CompanyUserRole.OWNER,
        status: CompanyUserStatus.ACTIVE,
        invitedByUserId: null,
        joinedAt: new Date(),
      });

      const savedMembership = await manager.save(membership);

      // 6️⃣ Optional audit log (if we have an initiating actor)
      if (initiatedByUserId) {
        const actorUser = await manager.findOne(User, {
          where: { id: initiatedByUserId },
        });
        if (!actorUser) {
          throw new NotFoundException('Initiating user not found');
        }

        const actorMembership = await manager.findOne(CompanyUser, {
          where: { companyId: savedCompany.id, userId: initiatedByUserId },
        });

        const tenant: TenantContext = {
          companyId: savedCompany.id,
          membershipId: actorMembership?.id ?? savedMembership.id,
          role: actorMembership?.role ?? CompanyUserRole.OWNER,
          status: actorMembership?.status ?? CompanyUserStatus.ACTIVE,
          userId: initiatedByUserId,
        };

        await this.auditLogs.logInTransaction(manager, {
          tenant,
          action: AuditAction.MEMBER_ADDED,
          entityType: AuditEntityType.COMPANY_USER,
          entityId: savedMembership.id,
          metadata: {
            companyId: savedCompany.id,
            userId: savedAdminUser.id,
            role: savedMembership.role,
            status: savedMembership.status,
            initiatedByUserId,
          },
        });
      }

      return {
        company: {
          id: savedCompany.id,
          name: savedCompany.name,
          registrationNumber: savedCompany.registrationNumber,
          status: savedCompany.status,
        },
        adminUser: {
          id: savedAdminUser.id,
          fullName: savedAdminUser.fullName,
          email: savedAdminUser.email,
        },
      };
    });
  }

  /**
   * Returns companies the user belongs to via company_users (DTO only).
   */
  async findCompaniesForUser(userId: string): Promise<CompanyListItemDto[]> {
    const memberships = await this.companyUserRepository.find({
      where: { userId, status: CompanyUserStatus.ACTIVE },
      select: ['companyId'],
    });
    const companyIds = [...new Set(memberships.map((m) => m.companyId))];
    if (companyIds.length === 0) {
      return [];
    }
    const companies = await this.companyRepository.find({
      where: { id: In(companyIds) },
      select: ['id', 'name', 'registrationNumber', 'status'],
      order: { name: 'ASC' },
    });
    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      registrationNumber: c.registrationNumber,
      status: c.status,
    }));
  }

  /**
   * Returns one company by id (DTO only). Caller must ensure tenant scoping (e.g. via guards).
   */
  async findOne(companyId: string): Promise<CompanyListItemDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      select: ['id', 'name', 'registrationNumber', 'status'],
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return {
      id: company.id,
      name: company.name,
      registrationNumber: company.registrationNumber,
      status: company.status,
    };
  }
}