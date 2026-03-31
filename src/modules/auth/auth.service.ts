import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import {
  AuthResponseDto,
  AuthUserDto,
} from './dto/auth-response.dto';
import { UserSession } from './entities/user-session.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existing = await this.usersService.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.createUser({
      fullName: dto.fullName,
      email: normalizedEmail,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
    });

    const { accessToken, refreshToken } =
      await this.generateTokensAndSession(user);

    return {
      accessToken,
      refreshToken,
      user: this.mapUserToAuthUserDto(user),
    };
  }

  async login(
    dto: LoginDto,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.usersService.findByEmailForAuth(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } =
      await this.generateTokensAndSession(user, metadata);

    return {
      accessToken,
      refreshToken,
      user: this.mapUserToAuthUserDto(user),
    };
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.mapUserToAuthUserDto(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
    );
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET must be set');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId: string = payload.sub;
    const sessionId: string | undefined = payload.sid;

    if (!sessionId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });

    if (!session || !session.user || session.user.id !== userId) {
      throw new UnauthorizedException('Invalid session');
    }

    const now = new Date();

    if (session.revokedAt || session.expiresAt <= now) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const matches = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    session.revokedAt = now;
    await this.sessionsRepo.save(session);

    const user = session.user;
    if (!user) {
      throw new UnauthorizedException('User not found for session');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokensAndSession(user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.mapUserToAuthUserDto(user),
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
    );
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET must be set');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      return;
    }

    const userId: string = payload.sub;
    const sessionId: string | undefined = payload.sid;

    if (!sessionId) {
      return;
    }

    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });

    if (!session || !session.user || session.user.id !== userId) {
      return;
    }

    if (session.revokedAt) {
      return;
    }

    const matches = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );
    if (!matches) {
      return;
    }

    session.revokedAt = new Date();
    await this.sessionsRepo.save(session);
  }

  /**
   * Deletes expired and revoked sessions to prevent unbounded table growth.
   * Schedule this via cron (e.g. daily) or a job runner, e.g.:
   *   cron: '0 3 * * *' (3 AM daily) or call from a NestJS @Cron() job.
   */
  async cleanupExpiredAndRevokedSessions(): Promise<number> {
    const now = new Date();
    const result = await this.sessionsRepo
      .createQueryBuilder()
      .delete()
      .from(UserSession)
      .where('expiresAt < :now', { now })
      .orWhere('revokedAt IS NOT NULL')
      .execute();
    return result.affected ?? 0;
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    const sessions = await this.sessionsRepo.find({
      where: {
        user: { id: userId },
        revokedAt: IsNull(),
      },
    });

    const now = new Date();

    for (const session of sessions) {
      session.revokedAt = now;
    }

    await this.sessionsRepo.save(sessions);
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private async generateTokensAndSession(
    user: User,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(user);

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    if (!refreshSecret || !refreshExpiresIn) {
      throw new Error(
        'JWT_REFRESH_SECRET and JWT_REFRESH_EXPIRES_IN must be set',
      );
    }

    const { refreshToken } = await this.sessionsRepo.manager.transaction(
      async (entityManager) => {
        const sessionRepo = entityManager.getRepository(UserSession);

        // 1) Create session row first so we have a stable session id (sid)
        const provisionalSession = sessionRepo.create({
          user,
          refreshTokenHash: '',
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
          // provisional expiresAt; will be updated right after signing the token
          expiresAt: new Date(),
        });
        const savedSession = await sessionRepo.save(provisionalSession);

        // 2) Sign refresh token with both user id (sub) and session id (sid)
        const refreshTokenPayload = {
          sub: user.id,
          sid: savedSession.id,
        };

        const refreshToken = this.jwtService.sign(refreshTokenPayload, {
          secret: refreshSecret,
          expiresIn: refreshExpiresIn,
        } as JwtSignOptions);

        // 3) Decode to compute actual expiry and hash the signed token
        const decoded: any = this.jwtService.decode(refreshToken);
        const expiresAt = decoded?.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        savedSession.refreshTokenHash = refreshTokenHash;
        savedSession.expiresAt = expiresAt;
        await sessionRepo.save(savedSession);

        return { refreshToken };
      },
    );

    return { accessToken, refreshToken };
  }

  private mapUserToAuthUserDto(user: User): AuthUserDto {
    const dto = new AuthUserDto();
    dto.id = user.id;
    dto.fullName = user.fullName;
    dto.email = user.email;
    dto.phone = user.phone;
    dto.role = user.role;
    dto.status = user.status;
    return dto;
  }
}
