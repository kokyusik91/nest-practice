import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';
import { UsersModel } from '../entities/users.entity';

// AccessTokenGuard와 함께 사용해야한다.
export const User = createParamDecorator(
  (data: keyof UsersModel | undefined, context: ExecutionContext) => {
    // 요청 가져오기
    const req = context.switchToHttp().getRequest();

    const user = req.user as UsersModel;

    // 서버에서 잘못한 거다!
    if (!user) {
      throw new InternalServerErrorException(
        'Request에 User 프로퍼티가 존재하지 않습니다!.',
      );
    }

    if (!data) {
      return user[data];
    }

    return user;
  },
);
