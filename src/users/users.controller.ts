import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { RoleEnum } from './const/roles.const';
import { Roles } from './decorator/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // auth에서 관리하므로 삭제
  // @Post()
  // postUser(
  //   @Body('nickname') nickname: string,
  //   @Body('email') email: string,
  //   @Body('password') password: string,
  // ) {
  //   return this.usersService.createUser({ email, nickname, password });
  // }

  @Get()
  @Roles(RoleEnum.ADMIN)
  // @UseInterceptors(ClassSerializerInterceptor)
  /**
   * serialization -> 직렬화 -> 현재 시스템에서 사용되는 (NestJS) 데이터의 구조를 다른 시스템에서도 쉽게 사용 할 수 있는 포맷으로 변환
   *
   * -> class의 Object에서 JSON 포맷으로 변환
   */
  getUser() {
    return this.usersService.getAllUser();
  }
}
