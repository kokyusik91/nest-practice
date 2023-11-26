/**
 * 구현할 기능
 *
 * 1) 요청 객체 (request)를 불러오고
 *    authroization header로 부터 토큰을 가져온다.
 *
 * 2) authService.extractTokenFromHeader를 이용해서
 *    사용 할 수 있는 형태의 토큰을 추출한다.
 *
 * 3) authService.decodeBasicToken을 실행해서
 *    email과 password를 추출한다.
 *
 * 4) email과 password를 이용해서 사용자를 가져온다.
 *    authService.authenticateWithEmailAndPassword
 *
 * 5) 찾아낸 사용자를 (1) 요청 객체에 붙여준다.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class BasicTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  // boolean 타입 false면 가드 통과 못함.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 해당 요청 객체 가져오기
    const req = context.switchToHttp().getRequest();

    // header에서 basic token을 추출한다.
    // {authorization : Basic asdqweasdads }
    // asdqweasdads
    const rawToken = req.headers['authorization'];

    //
    if (!rawToken) {
      throw new UnauthorizedException('토큰이 없습니다!');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, false);
    const { email, password } = this.authService.decodeBasicToken(token);

    const user = await this.authService.authenticateWithEmailAndPassword({
      email,
      password,
    });

    req.user = user;

    // 에러를 모두 통과했다면??? true 반환 아니면 error 반환
    return true;
  }
}
