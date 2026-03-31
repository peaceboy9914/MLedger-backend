import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../guards/platform-roles.guard';
import { PlatformRoles } from '../decorators/platform-roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';
import { PlatformUsersService, PlatformUserListItem } from './platform-users.service';
import { ListPlatformUsersQueryDto } from './dto/list-platform-users-query.dto';

@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(UserRole.SUPER_ADMIN)
@Controller('platform/users')
export class PlatformUsersController {
  constructor(private readonly users: PlatformUsersService) {}

  @Get()
  async list(
    @Query() query: ListPlatformUsersQueryDto,
  ): Promise<{
    data: PlatformUserListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.users.list(query);
  }
}

