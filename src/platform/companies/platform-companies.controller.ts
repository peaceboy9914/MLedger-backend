import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../guards/platform-roles.guard';
import { PlatformRoles } from '../decorators/platform-roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';
import { PlatformCompaniesService } from './platform-companies.service';
import { ListPlatformCompaniesQueryDto } from './dto/list-platform-companies-query.dto';
import {
  PlatformCompanyDetailDto,
  PlatformCompanyListItemDto,
} from './dto/platform-company-response.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { OnboardPlatformCompanyRequestDto } from './dto/onboard-platform-company.dto';
import { OnboardPlatformCompanyResponseDto } from './dto/onboard-platform-company-response.dto';

@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(UserRole.SUPER_ADMIN)
@Controller('platform/companies')
export class PlatformCompaniesController {
  constructor(private readonly companies: PlatformCompaniesService) {}

  @Post('onboard')
  async onboard(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OnboardPlatformCompanyRequestDto,
  ): Promise<OnboardPlatformCompanyResponseDto> {
    return this.companies.onboardCompany(user.id, dto);
  }

  @Get()
  async list(
    @Query() query: ListPlatformCompaniesQueryDto,
  ): Promise<{
    data: PlatformCompanyListItemDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.companies.list(query);
  }

  @Get(':companyId')
  async getById(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<PlatformCompanyDetailDto> {
    return this.companies.getById(companyId);
  }

  @Patch(':companyId/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: UpdateCompanyStatusDto,
  ): Promise<PlatformCompanyDetailDto> {
    return this.companies.updateStatus(user.id, companyId, dto);
  }
}

