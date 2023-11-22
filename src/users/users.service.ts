import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersModel)
    private readonly userRepository: Repository<UsersModel>,
  ) {}

  async createUser(user: Pick<UsersModel, 'email' | 'password' | 'nickname'>) {
    // 1) nickname 중복이 없는지 확인
    // exist() => 만약에 조건에 해당되는 값이 있으면 true 반환
    const nicknameExists = await this.userRepository.exist({
      where: {
        nickname: user.nickname,
      },
    });

    if (nicknameExists) {
      throw new BadRequestException('이미 존재하는 nickname 입니다!');
    }

    const emailExists = await this.userRepository.exist({
      where: {
        email: user.email,
      },
    });

    if (emailExists) {
      throw new BadRequestException('이미 가입한 이메일 입니다!');
    }

    const userObject = this.userRepository.create({
      email: user.email,
      nickname: user.nickname,
      password: user.password,
    });
    // DB에 save
    const newUser = await this.userRepository.save(userObject);

    return newUser;
  }

  async getAllUser() {
    return this.userRepository.find();
  }

  // email로 사용자 정보 확인
  async getUserByEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }
}
