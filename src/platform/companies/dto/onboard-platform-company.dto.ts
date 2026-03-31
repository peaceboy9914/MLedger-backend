import {
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OnboardCompanyDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  authorizedCapital: number;

  @IsOptional()
  @IsString()
  registrationNumber?: string;
}

class OnboardInitialOwnerDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class OnboardPlatformCompanyRequestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => OnboardCompanyDto)
  company: OnboardCompanyDto;

  @IsObject()
  @ValidateNested()
  @Type(() => OnboardInitialOwnerDto)
  initialOwner: OnboardInitialOwnerDto;
}

