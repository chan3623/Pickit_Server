import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { envVariablesKeys } from '../common/const/env.const';
import { CreateUserDto } from './dto/create-user.dto';
import { Role, User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,

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

    await this.userRepository.save({
      email,
      password: hash,
      role: type === 'user' ? Role.user : Role.admin,
    });

    return await this.userRepository.findOne({
      select: { id: true, email: true, role: true },
      where: { email },
    });
  }

  async getMe(userId: number) {
    return this.userRepository.findOne({
      select: {
        id: true,
        email: true,
        role: true,
      },
      where: {
        id: userId,
      },
    });
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
}
