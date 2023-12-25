import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RoleEnum } from 'src/users/const/roles.const';
import { PostsService } from '../posts.service';
import { Request } from 'express';
import { UsersModel } from 'src/users/entities/users.entity';

@Injectable()
export class IsPostMineOrAdminGuard implements CanActivate {
  constructor(private readonly postService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest() as Request & {
      user: UsersModel;
    };

    const { user } = req;

    if (!user) {
      throw new UnauthorizedException('사용자 정보를 가졍ㄹ 수 없습니다!');
    }

    /**
     *  Admin일 경우 그냥 패스 (오드민은 어떤 기능도 사용가능)
     *  유저 정보에 role이라는 프로퍼티가 있으므로 접근 가능
     */

    if (user.role === RoleEnum.ADMIN) {
      return true;
    }

    const postId = req.params.postId;

    //
    if (!postId) {
      throw new BadRequestException(`Post Id가 파라미터로 제공 돼야합니다.`);
    }

    return this.postService.isPostMine(user.id, parseInt(postId));
  }
}
