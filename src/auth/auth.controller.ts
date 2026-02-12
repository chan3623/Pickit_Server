import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Authorization } from './decorator/authorization.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import { LoginType } from './decorator/login-type.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Authorization() token: string, @LoginType() loginType: number) {
    return this.authService.login(token, loginType);
  }
}
