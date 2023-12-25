import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
// import {
//   MaxLengthPipe,
//   MinLengthPipe,
//   // PasswordPipe,
// } from './pipe/password.pipe';
import { BasicTokenGuard } from './guard/basic-token.guard';
import { AccessTokenGuard } from './guard/bearer-token.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { IsPublic } from 'src/common/decorator/is-public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // AccessToken 새로 발급 받는 api
  @Post('token/access')
  @IsPublic()
  @UseGuards(AccessTokenGuard)
  postTokenAccess(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    /**
     * {accessToken : {token}}
     */

    const newToken = this.authService.rotateToken(token, false);
    return {
      accessToken: newToken,
    };
  }

  // RefreshToken 새로 발급 받는 api
  @Post('token/refresh')
  @IsPublic()
  @UseGuards(AccessTokenGuard)
  postRefreshAccess(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    /**
     * {refreshToken : {token}}
     */

    const newToken = this.authService.rotateToken(token, true);
    return {
      refreshToken: newToken,
    };
  }

  // header에서 basic token을 받아 email, password로 분리
  // email:password -> base64
  @Post('login/email')
  @IsPublic()
  @UseGuards(BasicTokenGuard)
  postLoginEmail(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, false);
    const credentials = this.authService.decodeBasicToken(token);
    return this.authService.loginWithEmail(credentials);
  }

  // 회원 가입 => RegisterUserDto + Class validator 사용
  @Post('register/email')
  @IsPublic()
  postRegisterEmail(@Body() body: RegisterUserDto) {
    return this.authService.registerWithEmail(body);
  }

  // 기존 회원가입 Controller logic => Pipe 사용
  // @Post('register/email')
  // postRegisterEmail(
  //   @Body('nickname') nickname: string,
  //   @Body('email') email: string,
  //   // 인스턴스화 해서 넣을때 장점 : constructor에 인자를 넘길 수 있음.
  //   @Body('password', new MaxLengthPipe(8), new MinLengthPipe(3))
  //   password: string,
  // ) {
  //   return this.authService.registerWithEmail({ nickname, password, email });
  // }
}
