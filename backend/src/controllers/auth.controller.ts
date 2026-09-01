import { Controller, Post, Body, Req, Get, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.entity';
import { RegisterTenantDto, LoginDto, CreateMemberDto } from '../dtos/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new Tenant and its Admin owner' })
  @Post('register-tenant')
  registerTenant(@Body() data: RegisterTenantDto) {
    return this.authService.registerTenant(data);
  }

  @ApiOperation({ summary: 'Login and get a JWT token' })
  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data.email, data.password);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new staff member (Admin only)' })
  @Roles(UserRole.ADMIN)
  @Post('create-member')
  createMember(@Req() req: any, @Body() data: CreateMemberDto) {
    return this.authService.createMember(req.user, data);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all staff members for the tenant' })
  @Roles(UserRole.ADMIN)
  @Get('members')
  listMembers(@Req() req: any) {
    return this.authService.listMembers(req.user.tenantId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a staff member' })
  @Roles(UserRole.ADMIN)
  @Delete('member/:id')
  deleteMember(@Req() req: any, @Param('id') id: string) {
    return this.authService.deleteMember(req.user, id);
  }
}
