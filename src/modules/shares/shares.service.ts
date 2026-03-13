import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ShareTransaction, TransactionType } from '../share-transactions/entities/share-transaction.entity';
import { ShareCertificate } from '../share-certificates/entities/share-certificate.entity';
import { Company } from '../companies/entities/company.entity';
import { IssueSharesDto } from './dto/issue-shares.dto';
import { TransferSharesDto } from './dto/transfer-shares.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditEntityType } from '../audit-logs/entities/audit-log.entity';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { Shareholder } from '../shareholders/entities/shareholder.entity';
import { IssueSharesResponseDto } from './dto/issue-shares-response.dto';
import { TransferSharesResponseDto } from './dto/transfer-shares-response.dto';
import { CapTableCacheService } from '../cap-table/cap-table-cache.service';

@Injectable()
export class SharesService {

    constructor(
        private dataSource: DataSource,
        private readonly auditLogs: AuditLogsService,
        private readonly capTableCache: CapTableCacheService,
    ) {}

    async issueShares(companyId: string, dto: IssueSharesDto, tenant: TenantContext) {

        const result = await this.dataSource.transaction(async manager => {

            const company = await manager.findOne(Company, {
                where: { id: companyId }
            });

            if (!company) {
                throw new NotFoundException("Company not found");
            }

            const shareholder = await manager.findOne(Shareholder, {
                where: { id: dto.shareholderId, company: { id: companyId } },
            });

            if (!shareholder) {
                throw new NotFoundException('Shareholder not found');
            }

            const authorizedShares =
            Number(company.authorizedCapital) /
            Number(company.parValue);

            const issuedShares = await this.getTotalIssuedShares(companyId);

            const newTotal = issuedShares + dto.shares;

            if (newTotal > authorizedShares) {
                throw new Error(
                    `Cannot issue shares. Authorized limit exceeded. Max allowed: ${authorizedShares}`
                );
            }

            const transaction = manager.create(ShareTransaction, {
                type: TransactionType.ISSUE,
                company: { id: companyId },
                toShareholder: { id: dto.shareholderId },
                shares: dto.shares
            });

            await manager.save(transaction);

            const certificate = manager.create(ShareCertificate, {
                certificateNumber: `CERT-${Date.now()}`,
                company: { id: companyId },
                companyId,
                shareholder: { id: dto.shareholderId },
                shareholderId: dto.shareholderId,
                sharesIssued: dto.shares
            });

            await manager.save(certificate);

            await this.auditLogs.logInTransaction(manager, {
                tenant,
                action: AuditAction.SHARE_ISSUED,
                entityType: AuditEntityType.SHARE_TRANSACTION,
                entityId: transaction.id,
                metadata: {
                    shareholderId: dto.shareholderId,
                    shares: dto.shares,
                    certificateId: certificate.id,
                },
            });

            return IssueSharesResponseDto.fromEntities(transaction, certificate);

        });

        await this.capTableCache.invalidateCapTable(companyId);
        return result;
    }

    async getTotalIssuedShares(companyId: string) {

        const result = await this.dataSource
            .getRepository(ShareTransaction)
            .createQueryBuilder("tx")
            .select("SUM(tx.shares)", "sum")
            .where("tx.companyId = :companyId", { companyId })
            .andWhere("tx.type = :type", { type: TransactionType.ISSUE })
            .getRawOne();

        return Number(result.sum) || 0;
    }

    async transferShares(
        companyId: string,
        dto: TransferSharesDto,
        tenant: TenantContext,
    ): Promise<TransferSharesResponseDto> {
        const result = await this.dataSource.transaction(async (manager) => {
            const txRepo = manager.getRepository(ShareTransaction);

            // Lock all ledger rows that affect the sender's balance for this company (FOR UPDATE).
            // Prevents race: two concurrent transfers both passing validation.
            await txRepo
                .createQueryBuilder('tx')
                .where('tx.companyId = :companyId', { companyId })
                .andWhere(
                    '(tx.toShareholderId = :shareholderId OR tx.fromShareholderId = :shareholderId)',
                    { shareholderId: dto.fromShareholderId },
                )
                .setLock('pessimistic_write')
                .getMany();

            const receivedRow = await txRepo
                .createQueryBuilder('tx')
                .select('COALESCE(SUM(tx.shares), 0)', 'sum')
                .where('tx.companyId = :companyId', { companyId })
                .andWhere('tx.toShareholderId = :shareholderId', {
                    shareholderId: dto.fromShareholderId,
                })
                .getRawOne<{ sum: string }>();

            const sentRow = await txRepo
                .createQueryBuilder('tx')
                .select('COALESCE(SUM(tx.shares), 0)', 'sum')
                .where('tx.companyId = :companyId', { companyId })
                .andWhere('tx.fromShareholderId = :shareholderId', {
                    shareholderId: dto.fromShareholderId,
                })
                .getRawOne<{ sum: string }>();

            const received = Number(receivedRow?.sum ?? 0);
            const sent = Number(sentRow?.sum ?? 0);
            const balance = received - sent;

            if (balance < dto.shares) {
                throw new BadRequestException(
                    `Insufficient shares. Balance: ${balance}, requested: ${dto.shares}`,
                );
            }

            const transaction = manager.create(ShareTransaction, {
                type: TransactionType.TRANSFER,
                company: { id: companyId },
                fromShareholder: { id: dto.fromShareholderId },
                toShareholder: { id: dto.toShareholderId },
                shares: dto.shares,
            });

            const saved = await manager.save(transaction);

            await this.auditLogs.logInTransaction(manager, {
                tenant,
                action: AuditAction.SHARE_TRANSFERRED,
                entityType: AuditEntityType.SHARE_TRANSACTION,
                entityId: saved.id,
                metadata: {
                    fromShareholderId: dto.fromShareholderId,
                    toShareholderId: dto.toShareholderId,
                    shares: dto.shares,
                },
            });

            return TransferSharesResponseDto.fromEntity(saved);
        });

        await this.capTableCache.invalidateCapTable(companyId);
        return result;
    }
}
