import { Body, Controller, Get, Post, Param, Patch, UseGuards } from '@nestjs/common';
import { ShareholdersService } from './shareholders.service';
import { CreateShareholderDto } from './dto/create-shareholder.dto';
import { UpdateshareholderDto } from './dto/update-shareholder.dto';
import { ShareholderResponseDto } from './dto/shareholder-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyMembershipGuard } from '../../common/guards/company-membership.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyUserRole } from '../company-users/entities/company-user.entity';
import { CompanyActiveGuard } from '../companies/guards/company-active.guard';

@Controller('companies/:companyId/shareholders')
export class ShareholdersController {
    constructor(
        private readonly service: ShareholdersService
    ) {}

    @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard, CompanyActiveGuard)
    @Roles(CompanyUserRole.OWNER, CompanyUserRole.ADMIN, CompanyUserRole.LEGAL)
    @Post()
    create(
        @Param('companyId') _companyId: string,
        @CurrentTenant() tenant: TenantContext,
        @Body() dto: CreateShareholderDto,
    ): Promise<ShareholderResponseDto> {
        return this.service.create(dto, tenant.companyId, tenant);
    }

    @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
    @Roles(
        CompanyUserRole.OWNER,
        CompanyUserRole.ADMIN,
        CompanyUserRole.LEGAL,
        CompanyUserRole.FINANCE,
        CompanyUserRole.VIEWER,
    )
    @Get()
    findAll(
        @Param('companyId') _companyId: string,
        @CurrentTenant() tenant: TenantContext,
    ): Promise<ShareholderResponseDto[]> {
        return this.service.findAll(tenant.companyId);
    }

    @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
    @Roles(
        CompanyUserRole.OWNER,
        CompanyUserRole.ADMIN,
        CompanyUserRole.LEGAL,
        CompanyUserRole.FINANCE,
        CompanyUserRole.VIEWER,
    )
    @Get(':id')
    findOne(
        @Param('companyId') _companyId: string,
        @CurrentTenant() tenant: TenantContext,
        @Param('id') id: string,
    ): Promise<ShareholderResponseDto> {
        return this.service.findOne(id, tenant.companyId);
    }

    @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard, CompanyActiveGuard)
    @Roles(CompanyUserRole.OWNER, CompanyUserRole.ADMIN, CompanyUserRole.LEGAL)
    @Patch(':id')
    update(
        @Param('companyId') _companyId: string,
        @CurrentTenant() tenant: TenantContext,
        @Param('id') id: string,
        @Body() dto: UpdateshareholderDto,
    ): Promise<ShareholderResponseDto> {
        return this.service.update(id, tenant.companyId, dto, tenant);
    }
}
