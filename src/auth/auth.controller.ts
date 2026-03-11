import { Controller, Post } from '@nestjs/common';
import { Public } from '../common/decorator/public.decorator';
import { User } from '../user/decorator/user.decorator';
import { AuthService } from './auth.service';
import { Authorization } from './decorator/authorization.decorator';
import { LoginType } from './decorator/login-type.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Authorization() token: string, @LoginType() loginType: number) {
    return await this.authService.login(token, loginType);
  }

  @Post('logout')
  logout(@User('id') userId: number) {
    return this.authService.logout(userId);
  }

  @Public()
  @Post('refresh')
  refresh(@Authorization() token: string) {
    return this.authService.refresh(token);
  }
}
