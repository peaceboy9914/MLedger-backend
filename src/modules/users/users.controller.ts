import { Controller } from '@nestjs/common';

/**
 * Users module controller. Any future user-facing endpoints must return UserResponseDto
 * (or a dedicated DTO), never raw User entities. Stub GET /users was removed.
 */
@Controller('users')
export class UsersController {}
