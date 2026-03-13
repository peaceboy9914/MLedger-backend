import { ShareCertificate } from '../entities/share-certificate.entity';

export class ShareCertificateResponseDto {
  id: string;
  certificateNumber: string;
  shareholderId: string;
  companyId: string;
  sharesIssued: number;
  issuedAt: Date;

  static fromEntity(entity: ShareCertificate): ShareCertificateResponseDto {
    const dto = new ShareCertificateResponseDto();
    dto.id = entity.id;
    dto.certificateNumber = entity.certificateNumber;
    dto.sharesIssued = entity.sharesIssued;
    dto.issuedAt = entity.issuedAt;
    dto.companyId = (entity as any).companyId ?? (entity.company as any)?.id;
    dto.shareholderId =
      (entity as any).shareholderId ?? (entity.shareholder as any)?.id;
    return dto;
  }
}

