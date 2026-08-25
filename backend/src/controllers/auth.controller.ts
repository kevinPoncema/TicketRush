import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-tenant')
  registerTenant(@Body() data: any) {
    return this.authService.registerTenant(data);
  }

  @Post('login')
  login(@Body() data: any) {
    return this.authService.login(data.email, data.password);
  }

  @Roles(UserRole.ADMIN)
  @Post('create-member')
  createMember(@Req() req: any, @Body() data: any) {
    return this.authService.createMember(req.user, data);
  }
}
