import { Controller, Get, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompanyListItemDto } from './dto/company-list-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

/**
 * User-scoped company routes. No :companyId in path — no CompanyMembershipGuard.
 * Lists companies the authenticated user belongs to via company_users.
 */
@Controller('me')
export class MeCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('companies')
  getMyCompanies(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CompanyListItemDto[]> {
    return this.companiesService.findCompaniesForUser(user.id);
  }
}
