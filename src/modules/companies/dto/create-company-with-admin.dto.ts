import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCompanyWithAdminDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsNumber()
  authorizedCapital: number;

  // Admin Info
  @IsString()
  @IsNotEmpty()
  adminFullName: string;

  @IsEmail()
  adminEmail: string;

  @MinLength(6)
  adminPassword: string;

  /**
   * Optional ID of an actor user who is initiating onboarding.
   * When provided, an audit log can be recorded with this user as the actor.
   * This is mainly intended for internal / platform tooling flows.
   */
  @IsOptional()
  @IsString()
  initiatedByUserId?: string;
}