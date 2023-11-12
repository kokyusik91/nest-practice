import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersModel)
    private readonly userRepository: Repository<UsersModel>,
  ) {}

  async createUser(email: string, nickname: string, password: string) {
    const user = this.userRepository.create({
      email,
      nickname,
      password,
    });
    // DB에 save
    const newUser = await this.userRepository.save(user);

    return newUser;
  }

  async getAllUser() {
    return this.userRepository.find();
  }
}
