import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { SharesService } from './shares.service';
import { IssueSharesDto } from './dto/issue-shares.dto';
import { TransferSharesDto } from './dto/transfer-shares.dto';
import { TransferSharesResponseDto } from './dto/transfer-shares-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyMembershipGuard } from '../../common/guards/company-membership.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyUserRole } from '../company-users/entities/company-user.entity';
import { CompanyActiveGuard } from '../companies/guards/company-active.guard';

@Controller('companies/:companyId/shares')
export class SharesController {

    constructor(private service: SharesService) {}

    @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard, CompanyActiveGuard)
    @Roles(CompanyUserRole.OWNER, CompanyUserRole.ADMIN, CompanyUserRole.LEGAL)
    @Post("issue")
    issue(
        @Param('companyId') _companyId: string,
        @CurrentTenant() tenant: TenantContext,
        @Body() dto: IssueSharesDto,
    ) {
        return this.service.issueShares(tenant.companyId, dto, tenant);
    }

    @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard, CompanyActiveGuard)
    @Roles(CompanyUserRole.OWNER, CompanyUserRole.ADMIN, CompanyUserRole.LEGAL)
    @Post("transfer")
    transfer(
        @Param('companyId') _companyId: string,
        @CurrentTenant() tenant: TenantContext,
        @Body() dto: TransferSharesDto,
    ): Promise<TransferSharesResponseDto> {
        return this.service.transferShares(tenant.companyId, dto, tenant);
    }
}
