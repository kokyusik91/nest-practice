import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { Repository } from 'typeorm';
import { UserFollowersModel } from './entities/user-followers.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersModel)
    private readonly userRepository: Repository<UsersModel>,
    @InjectRepository(UserFollowersModel)
    private readonly userFollowRepository: Repository<UserFollowersModel>,
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

  // 팔로우 생성 === 팔로우 하기
  async followUser(followerId: number, followeeId: number) {
    await this.userFollowRepository.save({
      follower: {
        id: followerId,
      },
      followee: {
        id: followeeId,
      },
    });

    return true;
  }

  // 나를 팔로우 하고 있는 사람들 가져오기
  async getFollowers(userId: number, includeNotConfirmed: boolean) {
    /**
     * [
     *  {
     *    id : number,
     *    follower : UsersModel,
     *    followee : UsersModel,
     *    isConfirmed : boolean,
     *    createdAt : Date,
     *    updatedAt : Date,
     * }
     * ]
     */

    const where = {
      followee: {
        id: userId,
      },
    };

    // 컨펌된것들만 추가해라
    if (!includeNotConfirmed) {
      where['isConfirmed'] = true;
    }

    const result = await this.userFollowRepository.find({
      where,
      relations: {
        follower: true,
        followee: true,
      },
    });

    return result.map((x) => ({
      id: x.follower.id,
      nickname: x.follower.nickname,
      email: x.follower.email,
      isConfirmed: x.isConfirmed,
    }));
  }

  // 내가 팔로우 온것 승인하기
  async confirmFollow(followerId: number, followeeId: number) {
    const existing = await this.userFollowRepository.findOne({
      where: {
        follower: {
          id: followerId,
        },
        followee: {
          id: followeeId,
        },
      },
      relations: {
        follower: true,
        followee: true,
      },
    });

    if (!existing) {
      throw new BadRequestException('존재하지 않는 팔로우 요청입니다.');
    }

    await this.userFollowRepository.save({
      ...existing,
      isConfirmed: true,
    });

    return true;
  }

  // 내가 팔로우 온것 취소하기
  async deleteFollow(followerId: number, followeeId: number) {
    await this.userFollowRepository.delete({
      follower: {
        id: followerId,
      },
      followee: {
        id: followeeId,
      },
    });

    return true;
  }
}
