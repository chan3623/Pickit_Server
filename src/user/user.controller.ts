import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Authorization } from 'src/auth/decorator/authorization.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth-guard';
import { User } from './decorator/user.decorator';
import { Public } from 'src/common/decorator/public.decorator';

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

  @Get('reservation')
  getUserReservations(@User('id') userId: number) {
    return this.userService.findUserReservations(userId);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
