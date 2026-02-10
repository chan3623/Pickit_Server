import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
import { envVariablesKeys } from 'src/common/const/env.const';
import { In, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User } from './entities/user.entity';
import { PopupReservationInfo } from 'src/popup/entities/popup-reservation-info.entity';
import { PopupReservation } from 'src/popup/entities/popup-reservation.entity';
import { Popup } from 'src/popup/entities/popup.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Popup)
    private readonly popupRepository: Repository<Popup>,

    @InjectRepository(PopupReservation)
    private readonly popupReservationRepository: Repository<PopupReservation>,

    @InjectRepository(PopupReservationInfo)
    private readonly popupReservationInfoRepository: Repository<PopupReservationInfo>,

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

  async findUserReservations(userId: number) {
    // 1. 유저가 예약한 모든 PopupReservationInfo 조회
    const userReservationInfos = await this.popupReservationInfoRepository.find({
      where: { userId },
    });

    if (!userReservationInfos.length) return [];

    // 2. 예약 ID 배열 추출
    const reservationIds = userReservationInfos.map(info => info.reservationId);

    // 3. 예약 정보 조회 (PopupReservation)
    const reservations = await this.popupReservationRepository.find({
      where: { id: In(reservationIds) },
    });

    // 4. 팝업 ID 배열 추출
    const popupIds = reservations.map(r => r.popupId);

    // 5. 팝업 정보 조회
    const popups = await this.popupRepository.find({
      where: { id: In(popupIds) },
    });

    // 6. 데이터를 하나로 묶기
    const result = userReservationInfos
      .map(info => {
        const reservation = reservations.find(r => r.id === info.reservationId);
        if (!reservation) return null;

        const popup = popups.find(p => p.id === reservation.popupId);
        if (!popup) return null;

        return {
          popupId: popup.id,
          title: popup.title,
          address: popup.address,
          tel: popup.tel,
          imagePath: popup.imagePath,
          reservationDate: reservation.date,
          reservationTime: reservation.time,
          quantity: info.quantity,
          reserverPhone: info.reserverPhone,
        };
      })
      .filter(Boolean)
      // 7. 최근 예약순 정렬
      .sort((a, b) => {
        if (!a || !b) return 0;
        const dateTimeA = new Date(`${a.reservationDate}T${a.reservationTime}`);
        const dateTimeB = new Date(`${b.reservationDate}T${b.reservationTime}`);
        return dateTimeB.getTime() - dateTimeA.getTime(); // 내림차순
      });
    return result;
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
