import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ShareTransactionsService } from './share-transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyMembershipGuard } from '../../common/guards/company-membership.guard';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyUserRole } from '../company-users/entities/company-user.entity';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interfaces/tenant-context.interface';

@Controller('companies/:companyId/shareholders')
export class ShareTransactionsController {

    constructor(private service: ShareTransactionsService) {}

    @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
    @Roles(
        CompanyUserRole.OWNER,
        CompanyUserRole.ADMIN,
        CompanyUserRole.LEGAL,
        CompanyUserRole.FINANCE,
        CompanyUserRole.VIEWER,
    )
    @Get(':shareholderId/balance')
    getBalance(
        @Param('companyId', ParseUUIDPipe) _companyId: string,
        @Param('shareholderId', ParseUUIDPipe) shareholderId: string,
        @CurrentTenant() tenant: TenantContext,
    ) {
        return this.service.getShareholderBalance(
            tenant.companyId,
            shareholderId,
        );
    }
}
