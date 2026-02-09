import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
import { envVariablesKeys } from 'src/common/const/env.const';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, type: string) {
    const { email, password } = createUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariablesKeys.hashRounds) || 10,
    );

    return await this.userRepository.save({
      email,
      password: hash,
      role: type === 'user' ? Role.user : Role.admin,
    });
  }

  async getMe(userId: number) {
    return this.userRepository.findOne({
      select: {
        email: true,
      },
      where: {
        id: userId,
      },
    });
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('존재하지 않는 ID의 유저입니다.');
    }

    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
