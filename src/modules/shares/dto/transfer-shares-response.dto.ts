import {
  type ShareTransaction,
  TransactionType,
} from '../../share-transactions/entities/share-transaction.entity';

/**
 * Stable API response for share transfer.
 * Excludes ORM relations; safe for API contract.
 */
export class TransferSharesResponseDto {
  transactionId: string;
  companyId: string;
  fromShareholderId: string;
  toShareholderId: string;
  shares: number;
  type: TransactionType;
  createdAt: Date;

  static fromEntity(tx: ShareTransaction): TransferSharesResponseDto {
    const dto = new TransferSharesResponseDto();
    dto.transactionId = tx.id;
    dto.companyId =
      (tx as { companyId?: string }).companyId ??
      (tx as { company?: { id?: string } }).company?.id ??
      '';
    dto.fromShareholderId =
      (tx as { fromShareholderId?: string }).fromShareholderId ??
      (tx as { fromShareholder?: { id?: string } }).fromShareholder?.id ??
      '';
    dto.toShareholderId =
      (tx as { toShareholderId?: string }).toShareholderId ??
      (tx as { toShareholder?: { id?: string } }).toShareholder?.id ??
      '';
    dto.shares = tx.shares;
    dto.type = tx.type;
    dto.createdAt = tx.createdAt;
    return dto;
  }
}
