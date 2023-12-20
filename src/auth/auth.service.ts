import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HASH_ROUNDS_KEY,
  ENV_JWT_SECRET_KEY,
} from 'src/common/const/env-keys.const';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 토큰을 사용하게 되는 방식
   *
   * 1) 사용자가 로그인 또는 회원가입을 진행하면
   *   accessToken과 refreshToken을 발급받는다.
   *
   * 2) 사용자가 로그인할때는 Basic 토큰과 함께 요청을 보낸다.
   *   Basic Token은 '이메일:비밀번호'를 Base64로 인코딩한 형태이다. (클라에서 해야함)
   *  예) {authorizaion : 'Basic {token}'}
   *
   * 3) 아무나 접근 할 수 없는 정보 (private router)를 접근할때는
   * header에 accesstoken을 추가해서 요청을 해야한다. (클라에서 해야할 것)
   *
   *  4) 토큰과 요처을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸 사용자가 누구인지 알 수 있다.
   *
   * 5) 모든 토큰은 만료 기간이 있다. 만료기간이 지나면 새로운 토큰을 발급 받아야한다.
   *    그렇지 않으면 jwtService.verify()에서 인증이 통과 안된다.
   *    그러니 access 토큰을 새로 발급 받을 수 있는 /auth/token/access와 refresh 토큰을 새로 발급 받을 수 있는 /auth/token/refresh가 필요
   * 6) 토큰이 만료되면 각각의 토큰을 새로 발급 받을 수 있는 엗느 포인트에 요청을 해서, 새로운 토큰을
   * 발급받고 새로운 토큰을 사용해서, private Route에 접근한다.
   */

  // Header로 부터 토큰을 받을때, {authorizaion : 'Basic {token}'} 와 {authorizaion : 'Bearer {token}'} 으로 들어온다.

  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ');

    const prefix = isBearer ? 'Bearer' : 'Basic';
    // 토큰 검증
    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('잘못된 토큰입니다!');
    }

    const token = splitToken[1];

    return token;
  }
  /**
   * base64로 된 문자열로
   * Basic asdklsdklksldfkkl
   *
   * 1) asdklsdklksldfkkl -> email:password
   * 2) email:password -> [email, password]
   * 3) {email : email, password : password}
   */
  decodeBasicToken(base64String: string) {
    //  base64 => utf8 (일반 string)
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');

    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    const email = split[0];
    const password = split[1];

    return {
      email,
      password,
    };
  }

  /**
   * 토큰 인증 검증
   */

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      });
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료됐거나 잘못된 토큰 입니다.');
    }
  }

  rotateToken(token: string, isRefreshToken: boolean) {
    // jwt 토큰에 있는 payload를 받을 수 있다.
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
    });

    // 검증
    // sub : id,
    // email : email,
    // type : 'access' | 'refresh'
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 Refresh 토큰으로만 가능합니다!',
      );
    }

    return this.signToken(
      {
        ...decoded,
      },
      isRefreshToken,
    );
  }

  /**
   *  우리가 만드려는 기능
   *
   *  1) registerWithEmail : 이멜로 회원가입
   *     - email, nickname, password를 입력받고 사용자를 생성한다.
   *     - 생성이 완료되면, accessToken과 refreshToken을 바로 반환한다.
   *       회원가입 후 다시 로그인해주세요 <= 이런 쓸데없는 과정을 방지하기 위함
   *
   *  2) loginWithEmail
   *     - email, password를 입력하면 사용자 검증을 진행한다.
   *     - 검증이 완료되면 accessToken과 refreshToken을 반환한다.
   *
   *  3) loginUser 재사용 함수
   *     - (1)과 (2)에서 필요한 accessToken과 refreshToken을 반환하는 로직
   *
   *  4) signToken : 토큰을 생성하는 로직
   *    - (3)에서 필요한 accessToken과 refreshToken을 sign하는 로직
   *
   *  5) authenticateWithEmailAndPassword
   *    - (2) 에서 로그인을 진행할때 필요한 기본적인 검증 진행
   *          1. 사용자가 존재하는지 확인 email
   *          2. 비밀번호가 맞는지 확인
   *          3. 모두 통과되면 찾은 사용자 정보 반환
   *          5. loginWithEmail에서 반환된 데이터를 기반으로 토큰 생성
   */

  // payload에 들어갈 정보

  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  // 2번
  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  // 5번
  async authenticateWithEmailAndPassword(
    user: Pick<UsersModel, 'email' | 'password'>,
  ) {
    // 1. 사용자가 존재하는지 확인 email
    // 2. 비밀번호가 맞는지 확인
    // 3. 모두 통과되면 찾은 사용자 정보 반환

    const existingUser = await this.usersService.getUserByEmail(user.email);

    // 만역에 user가 존재하지 않으면? 에러 throw
    if (!existingUser) {
      throw new UnauthorizedException('존재하지 않는 사용자 입니다.');
    }

    /**
     * 1) 입력된 비밀번호 (유저에게 입력받은 비밀번호)
     * 2) 기존 db에 저장되어 있는 hash => 사용자 정보에 저장돼있는 hash
     */
    const passOk = await bcrypt.compare(user.password, existingUser.password);

    if (!passOk) {
      throw new UnauthorizedException('비밀번호가 틀렸스빈다.');
    }

    return existingUser;
  }

  // 2번 로그인
  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.authenticateWithEmailAndPassword(user);
    return this.loginUser(existingUser);
  }

  // 1번 회원가입
  async registerWithEmail(user: RegisterUserDto) {
    const hash = await bcrypt.hash(
      user.password,
      parseInt(this.configService.get<string>(ENV_HASH_ROUNDS_KEY)),
    );

    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });

    return this.loginUser(newUser);
  }
}
