import { IsString, IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../models/user.entity';

export class RegisterTenantDto {
  @ApiProperty({ example: 'Teatro Gran Rex' })
  @IsString()
  tenantName: string;

  @ApiProperty({ example: 'Admin Name' })
  @IsString()
  userName: string;

  @ApiProperty({ example: 'admin@teatro.com' })
  @IsEmail()
  userEmail: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  userPassword: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@teatro.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class CreateMemberDto {
  @ApiProperty({ example: 'Staff Name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'staff@teatro.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.STAFF })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
