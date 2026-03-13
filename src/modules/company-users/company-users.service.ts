import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUser, CompanyUserRole, CompanyUserStatus } from './entities/company-user.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { CompanyUserResponseDto } from './dto/company-user-response.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditEntityType } from '../audit-logs/entities/audit-log.entity';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';

@Injectable()
export class CompanyUsersService {
  constructor(
    @InjectRepository(CompanyUser)
    private readonly companyUserRepo: Repository<CompanyUser>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async createMembership(
    companyId: string,
    userId: string,
    role: CompanyUserRole,
    status: CompanyUserStatus,
    invitedByUserId?: string,
    actorTenant?: TenantContext,
  ): Promise<CompanyUserResponseDto> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let inviter: User | null = null;
    if (invitedByUserId) {
      inviter = await this.userRepo.findOne({ where: { id: invitedByUserId } });
      if (!inviter) {
        throw new NotFoundException('Inviter user not found');
      }
      const inviterMembership = await this.companyUserRepo.findOne({
        where: { companyId, userId: invitedByUserId },
      });
      if (!inviterMembership) {
        throw new ConflictException('Inviter does not belong to this company');
      }
    }

    const existing = await this.companyUserRepo.findOne({
      where: { companyId, userId },
    });
    if (existing) {
      throw new ConflictException('Membership already exists for this user and company');
    }

    const membership = this.companyUserRepo.create({
      companyId,
      userId,
      role,
      status,
      invitedByUserId: invitedByUserId ?? null,
      joinedAt: status === CompanyUserStatus.ACTIVE ? new Date() : null,
    });

    const saved = await this.companyUserRepo.save(membership);

    if (actorTenant) {
      await this.auditLogs.log({
        tenant: actorTenant,
        action: AuditAction.MEMBER_ADDED,
        entityType: AuditEntityType.COMPANY_USER,
        entityId: saved.id,
        metadata: {
          companyId: saved.companyId,
          userId: saved.userId,
          role: saved.role,
          status: saved.status,
          invitedByUserId: saved.invitedByUserId ?? null,
        },
      });
    }

    return this.toResponseDto(saved);
  }

  async findMembership(companyId: string, userId: string): Promise<CompanyUserResponseDto | null> {
    const membership = await this.companyUserRepo.findOne({
      where: { companyId, userId },
    });
    if (!membership) {
      return null;
    }
    return this.toResponseDto(membership);
  }

  async findActiveMembership(companyId: string, userId: string): Promise<CompanyUser | null> {
    const membership = await this.companyUserRepo.findOne({
      where: { companyId, userId, status: CompanyUserStatus.ACTIVE },
    });
    if (!membership) {
      return null;
    }
    return membership;
  }

  async listCompanyMembers(companyId: string): Promise<CompanyUserResponseDto[]> {
    const memberships = await this.companyUserRepo.find({
      where: { companyId },
      order: { createdAt: 'ASC' },
    });
    return memberships.map((m) => this.toResponseDto(m));
  }

  private toResponseDto(entity: CompanyUser): CompanyUserResponseDto {
    const dto = new CompanyUserResponseDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.userId = entity.userId;
    dto.role = entity.role;
    dto.status = entity.status;
    dto.invitedByUserId = entity.invitedByUserId ?? null;
    dto.joinedAt = entity.joinedAt ?? null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

