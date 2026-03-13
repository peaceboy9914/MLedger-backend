import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Shareholder } from './entities/shareholder.entity';
import { Repository } from 'typeorm';
import { CreateShareholderDto } from './dto/create-shareholder.dto';
import { UpdateshareholderDto } from './dto/update-shareholder.dto';
import { ShareholderResponseDto } from './dto/shareholder-response.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditEntityType, AuditMetadata } from '../audit-logs/entities/audit-log.entity';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';

@Injectable()
export class ShareholdersService {

    constructor(
        @InjectRepository(Shareholder)
        private repo: Repository<Shareholder>,
        private readonly auditLogs: AuditLogsService,
    ) {}

    async create(
        dto: CreateShareholderDto,
        tenantCompanyId: string,
        tenant: TenantContext,
    ): Promise<ShareholderResponseDto> {
        const shareholder = this.repo.create({
            ...dto,
            company: { id: tenantCompanyId },
        });
        const saved = await this.repo.save(shareholder);

        await this.auditLogs.log({
            tenant,
            action: AuditAction.SHAREHOLDER_CREATED,
            entityType: AuditEntityType.SHAREHOLDER,
            entityId: saved.id,
            metadata: {
                fullName: saved.fullName,
                email: saved.email ?? null,
                isActive: saved.isActive,
            },
        });

        return ShareholderResponseDto.fromEntity(saved);
    }

    async findAll(companyId: string): Promise<ShareholderResponseDto[]> {
        const list = await this.repo.find({
            where: { company: { id: companyId } },
        });
        return list.map(ShareholderResponseDto.fromEntity);
    }

    async findOne(id: string, companyId: string): Promise<ShareholderResponseDto> {
        const shareholder = await this.repo.findOne({
            where: { id, company: { id: companyId } },
        });

        if (!shareholder) {
            throw new NotFoundException('Shareholder not found');
        }
        return ShareholderResponseDto.fromEntity(shareholder);
    }

    async update(
        id: string,
        companyId: string,
        dto: UpdateshareholderDto,
        tenant: TenantContext,
    ): Promise<ShareholderResponseDto> {
        const shareholder = await this.repo.findOne({
            where: { id, company: { id: companyId } },
        });

        if (!shareholder) {
            throw new NotFoundException('Shareholder not found');
        }

        const before = {
            fullName: shareholder.fullName,
            email: shareholder.email ?? null,
            isActive: shareholder.isActive,
            address: shareholder.address ?? null,
        };

        Object.assign(shareholder, dto);
        const saved = await this.repo.save(shareholder);

        const after = {
            fullName: saved.fullName,
            email: saved.email ?? null,
            isActive: saved.isActive,
            address: saved.address ?? null,
        };

        const changes: Record<string, { before: unknown; after: unknown }> = {};
        (Object.keys(before) as Array<keyof typeof before>).forEach((key) => {
            if (before[key] !== after[key]) {
                changes[key] = {
                    before: before[key],
                    after: after[key],
                };
            }
        });

        await this.auditLogs.log({
            tenant,
            action: AuditAction.SHAREHOLDER_UPDATED,
            entityType: AuditEntityType.SHAREHOLDER,
            entityId: saved.id,
            metadata: { changes } as AuditMetadata,
        });

        return ShareholderResponseDto.fromEntity(saved);
    }
}
