import type { Shareholder } from '../entities/shareholder.entity';

/**
 * Stable API response for shareholder resources.
 * Excludes ORM relations and internal fields.
 */
export class ShareholderResponseDto {
  id: string;
  fullName: string;
  email?: string | null;
  nationalId?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Shareholder): ShareholderResponseDto {
    const dto = new ShareholderResponseDto();
    dto.id = entity.id;
    dto.fullName = entity.fullName;
    dto.email = entity.email ?? null;
    dto.nationalId = entity.nationalId ?? null;
    dto.address = entity.address ?? null;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
