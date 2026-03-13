import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateShareholderDto {

    @IsString()
    fullName: string;

    @IsString()
    phoneNumber: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    nationalId?: string;

    @IsOptional()
    @IsString()
    address?: string;
}