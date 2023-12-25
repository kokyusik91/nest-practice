import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RoleEnum } from 'src/users/const/roles.const';
import { UsersModel } from 'src/users/entities/users.entity';
import { CommentsService } from '../comments.service';

@Injectable()
export class IsCommentMineOrAdminGuard implements CanActivate {
  constructor(private readonly commentService: CommentsService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest() as Request & {
      user: UsersModel;
    };

    const { user } = req;

    if (!user) {
      throw new UnauthorizedException('사용자 정보를 가져올 수 없습니다!');
    }

    /**
     *  Admin일 경우 그냥 패스 (오드민은 어떤 기능도 사용가능)
     *  유저 정보에 role이라는 프로퍼티가 있으므로 접근 가능
     */

    if (user.role === RoleEnum.ADMIN) {
      return true;
    }

    const commentId = req.params.commentId;

    const isOk = await this.commentService.isCommentMine(
      user.id,
      parseInt(commentId),
    );

    if (!isOk) {
      throw new ForbiddenException('해당 댓글에 대한 권한이 없습니다!');
    }

    if (!commentId) {
      throw new BadRequestException(`Comment Id가 파라미터로 제공 돼야합니다.`);
    }

    return true;
  }
}
