import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyMembershipGuard } from '../../common/guards/company-membership.guard';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyUserRole } from '../company-users/entities/company-user.entity';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { ShareCertificate } from './entities/share-certificate.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareCertificateResponseDto } from './dto/share-certificate-response.dto';

@Controller('companies/:companyId/share-certificates')
export class ShareCertificatesController {
  constructor(
    @InjectRepository(ShareCertificate)
    private readonly repo: Repository<ShareCertificate>,
  ) {}

  @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
  @Roles(
    CompanyUserRole.OWNER,
    CompanyUserRole.ADMIN,
    CompanyUserRole.LEGAL,
    CompanyUserRole.FINANCE,
    CompanyUserRole.VIEWER,
  )
  @Get()
  async listForCompany(
    @Param('companyId', new ParseUUIDPipe()) _companyId: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ShareCertificateResponseDto[]> {
    const items = await this.repo.find({
      where: { companyId: tenant.companyId },
      order: { issuedAt: 'DESC' },
    });
    return items.map(ShareCertificateResponseDto.fromEntity);
  }

  @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
  @Roles(
    CompanyUserRole.OWNER,
    CompanyUserRole.ADMIN,
    CompanyUserRole.LEGAL,
    CompanyUserRole.FINANCE,
    CompanyUserRole.VIEWER,
  )
  @Get(':certificateId')
  async getOne(
    @Param('companyId', new ParseUUIDPipe()) _companyId: string,
    @Param('certificateId', new ParseUUIDPipe()) certificateId: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ShareCertificateResponseDto> {
    const entity = await this.repo.findOne({
      where: { id: certificateId, companyId: tenant.companyId },
    });

    if (!entity) {
      throw new (require('@nestjs/common').NotFoundException)(
        'Share certificate not found',
      );
    }

    return ShareCertificateResponseDto.fromEntity(entity);
  }
}

