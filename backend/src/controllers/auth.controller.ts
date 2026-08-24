import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register-tenant')
  registerTenant(@Body() data: any) {
    return this.authService.registerTenant(data);
  }

  @Post('login')
  login(@Body() data: any) {
    return this.authService.login(data.email, data.password);
  }

  @Post('create-member')
  createMember(@Req() req: any, @Body() data: any) {
    return this.authService.createMember(req.user, data);
  }
}
