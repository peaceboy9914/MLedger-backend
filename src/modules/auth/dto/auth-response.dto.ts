import { IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../../users/entities/user.entity';

export class AuthUserDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(1, { message: 'refreshToken must not be empty' })
  refreshToken: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

