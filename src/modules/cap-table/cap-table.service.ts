import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ShareTransaction,
  TransactionType,
} from '../share-transactions/entities/share-transaction.entity';
import { Company } from '../companies/entities/company.entity';
import { Shareholder } from '../shareholders/entities/shareholder.entity';
import { CapTableEntryDto } from './dto/cap-table-entry.dto';

@Injectable()
export class CapTableService {
  constructor(
    @InjectRepository(ShareTransaction)
    private readonly shareTransactionRepo: Repository<ShareTransaction>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Shareholder)
    private readonly shareholderRepo: Repository<Shareholder>,
  ) {}

  /**
   * Returns the cap table for a company. Balance is always derived from the ledger:
   * balance = received - sent (no stored balances). Considers ISSUE and TRANSFER:
   * - received = SUM(shares) where toShareholderId (ISSUE and TRANSFER to recipient)
   * - sent = SUM(shares) where fromShareholderId (TRANSFER from sender)
   * Total issued = SUM(shares) for type = ISSUE only.
   */
  async getCapTable(companyId: string): Promise<CapTableEntryDto[]> {
    await this.assertCompanyExists(companyId);

    const [totalIssued, receivedRows, sentRows] = await Promise.all([
      this.getTotalIssuedShares(companyId),
      this.getSharesReceivedByShareholder(companyId),
      this.getSharesSentByShareholder(companyId),
    ]);

    const receivedMap = new Map<string, number>();
    for (const row of receivedRows) {
      receivedMap.set(row.shareholderId, row.received);
    }
    const sentMap = new Map<string, number>();
    for (const row of sentRows) {
      sentMap.set(row.shareholderId, row.sent);
    }

    const allShareholderIds = new Set([
      ...receivedMap.keys(),
      ...sentMap.keys(),
    ]);
    const balanceMap = new Map<string, number>();
    for (const id of allShareholderIds) {
      const received = receivedMap.get(id) ?? 0;
      const sent = sentMap.get(id) ?? 0;
      const balance = received - sent;
      if (balance > 0) {
        balanceMap.set(id, balance);
      }
    }

    const shareholderIds = Array.from(balanceMap.keys());
    if (shareholderIds.length === 0) {
      return [];
    }

    const shareholders = await this.getShareholderDetails(companyId, shareholderIds);
    const shareholderById = new Map(shareholders.map((s) => [s.id, s]));

    const entries: CapTableEntryDto[] = [];
    for (const shareholderId of shareholderIds) {
      const balance = balanceMap.get(shareholderId)!;
      const shareholder = shareholderById.get(shareholderId);
      const ownershipPercentage =
        totalIssued > 0 ? (balance / totalIssued) * 100 : 0;

      entries.push({
        shareholderId,
        name: shareholder?.fullName ?? '',
        email: shareholder?.email,
        shares: balance,
        ownershipPercentage: Math.round(ownershipPercentage * 100) / 100,
      });
    }

    return entries.sort((a, b) => b.shares - a.shares);
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
    const exists = await this.companyRepo
      .createQueryBuilder('company')
      .where('company.id = :companyId', { companyId })
      .getExists();

    if (!exists) {
      throw new NotFoundException(`Company with id ${companyId} not found`);
    }
  }

  private async getTotalIssuedShares(companyId: string): Promise<number> {
    const result = await this.shareTransactionRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.shares), 0)', 'total')
      .where('tx.companyId = :companyId', { companyId })
      .andWhere('tx.type = :type', { type: TransactionType.ISSUE })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  /**
   * SUM(shares) grouped by toShareholderId (shares received). Includes ISSUE and TRANSFER.
   */
  private async getSharesReceivedByShareholder(
    companyId: string,
  ): Promise<{ shareholderId: string; received: number }[]> {
    const rows = await this.shareTransactionRepo
      .createQueryBuilder('tx')
      .select('tx.toShareholderId', 'shareholderId')
      .addSelect('SUM(tx.shares)', 'received')
      .where('tx.companyId = :companyId', { companyId })
      .andWhere('tx.toShareholderId IS NOT NULL')
      .groupBy('tx.toShareholderId')
      .getRawMany<{ shareholderId: string; received: string }>();

    return rows.map((r) => ({
      shareholderId: r.shareholderId,
      received: Number(r.received ?? 0),
    }));
  }

  /**
   * SUM(shares) grouped by fromShareholderId (shares sent). TRANSFER only (ISSUE has no from).
   */
  private async getSharesSentByShareholder(
    companyId: string,
  ): Promise<{ shareholderId: string; sent: number }[]> {
    const rows = await this.shareTransactionRepo
      .createQueryBuilder('tx')
      .select('tx.fromShareholderId', 'shareholderId')
      .addSelect('SUM(tx.shares)', 'sent')
      .where('tx.companyId = :companyId', { companyId })
      .andWhere('tx.fromShareholderId IS NOT NULL')
      .groupBy('tx.fromShareholderId')
      .getRawMany<{ shareholderId: string; sent: string }>();

    return rows.map((r) => ({
      shareholderId: r.shareholderId,
      sent: Number(r.sent ?? 0),
    }));
  }

  /**
   * Fetch shareholder id, fullName, email from shareholders table by ids.
   * Defense-in-depth: scoped by both shareholder ids and company ownership.
   */
  private async getShareholderDetails(
    companyId: string,
    shareholderIds: string[],
  ): Promise<Pick<Shareholder, 'id' | 'fullName' | 'email'>[]> {
    if (shareholderIds.length === 0) return [];
    return this.shareholderRepo.find({
      where: {
        id: In(shareholderIds),
        company: { id: companyId },
      },
      select: ['id', 'fullName', 'email'],
    });
  }
}
