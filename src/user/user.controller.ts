import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from '../common/decorator/public.decorator';
import { User } from './decorator/user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto, 'user');
  }

  @Public()
  @Post('admin')
  createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto, 'admin');
  }

  @Get('me')
  getMe(@User('id') userId: number) {
    return this.userService.getMe(userId);
  }
}
