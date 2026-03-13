import { ShareCertificateResponseDto } from '../../share-certificates/dto/share-certificate-response.dto';
import { ShareTransaction } from '../../share-transactions/entities/share-transaction.entity';
import { ShareCertificate } from '../../share-certificates/entities/share-certificate.entity';

export class IssueSharesResponseDto {
  transactionId: string;
  companyId: string;
  shareholderId: string;
  shares: number;
  certificate: ShareCertificateResponseDto;

  static fromEntities(
    transaction: ShareTransaction,
    certificate: ShareCertificate,
  ): IssueSharesResponseDto {
    const dto = new IssueSharesResponseDto();
    dto.transactionId = transaction.id;
    dto.companyId = (transaction as any).companyId ?? (transaction.company as any)?.id;
    dto.shareholderId =
      (transaction as any).toShareholderId ??
      (transaction.toShareholder as any)?.id;
    dto.shares = transaction.shares;
    dto.certificate = ShareCertificateResponseDto.fromEntity(certificate);
    return dto;
  }
}

