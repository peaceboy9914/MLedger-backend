import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

interface CreateUserInput {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const user = this.usersRepo.create({
      fullName: input.fullName,
      email: input.email.trim().toLowerCase(),
      phone: input.phone,
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.SHAREHOLDER,
    });
    return this.usersRepo.save(user);
  }

  /**
   * General-purpose lookup by email. Does not load passwordHash (safe for non-auth use).
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /**
   * Auth-only: loads user by email including passwordHash for login verification.
   * Use this only in auth flows (e.g. login); use findByEmail for other contexts.
   */
  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .where('user.email = :email', { email: email.trim().toLowerCase() })
      .addSelect('user.passwordHash')
      .getOne();
  }

  /**
   * General-purpose lookup by id. Does not load passwordHash (safe for non-auth use).
   */
  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }
}
