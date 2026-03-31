import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { ListPlatformUsersQueryDto } from './dto/list-platform-users-query.dto';

export interface PlatformUserListItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: Date;
}

@Injectable()
export class PlatformUsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async list(
    query: ListPlatformUsersQueryDto,
  ): Promise<{ data: PlatformUserListItem[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.usersRepo
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.search) {
      qb.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [entities, total] = await qb.getManyAndCount();

    const data: PlatformUserListItem[] = entities.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));

    return { data, total, page, limit };
  }
}

