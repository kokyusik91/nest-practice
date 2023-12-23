import {
  Body,
  Controller,
  // DefaultValuePipe,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { UsersModel } from 'src/users/entities/users.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageModelType } from 'src/common/entity/image.entity';
import { DataSource } from 'typeorm';
import { PostsImagesService } from './images.service';
// import { UsersModel } from 'src/users/entities/users.entity';

// Just 요청 받은것을 라우팅 해주는 부분!
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly dataSource: DataSource,
    private readonly postImagesService: PostsImagesService,
  ) {}

  @Get()
  getPosts(@Query() query: PaginatePostDto) {
    return this.postsService.paginatePosts(query);
  }

  // POST /posts/random
  @Post('random')
  @UseGuards(AccessTokenGuard)
  async postPostRandom(@User() user: UsersModel) {
    await this.postsService.generatePosts(user.id);
    return true;
  }

  // path parameter
  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  @Post()
  // AccessToken 없이는 밑에 로직이 실행되지 않는다.
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('image'))
  async postPosts(
    // 커스텀 데코레이터에서 req에 접근해 한번더 검증하고, user를 반환한다.
    @User('id') userId: number,
    // @Body('authorId') authorId: number,
    @Body() body: CreatePostDto,
    // @Body('title') title: string,
    // @Body('content') content: string,
    // public에 노출 시킬건지 아닌지를 받는 값인데, 넘기지 않으면 DefaultValuePipe에서 미리 설정해 줄 수 있다.
    // @Body('isPublic', new DefaultValuePipe(true)) isPublic: boolean,
  ) {
    // 이미 AccessTokenGuard에서, 토큰 검증후 request header에 user 객체를 할당해 놓았기 때문에, user의 id에 접근이 가능하다.
    // AccessTokenGuard에서 통과한다면, 절대적으로 user가 들어있을 수 밖에 없다.

    // 트렌잭션과 관련된 모든 쿼리를 담당할 쿼리 러너를 생성한다. (묶어줌)
    const qr = this.dataSource.createQueryRunner();

    // 쿼리 러너에 연결한다.
    await qr.connect();

    // 쿼리 러너에서 트랜잭션을 시작한다.
    // 이 시점부터 같은 쿼리 러너를 사용하면, 트랜잭션 안에서 데이터베이스 액션을 실행 할 수 있다.

    await qr.startTransaction();

    // 로직 실행
    try {
      const post = await this.postsService.createPost(userId, body, qr);

      for (let i = 0; i < body.images.length; i++) {
        // 옮겨지면 아래 로직 실행
        await this.postImagesService.createPostImage(
          {
            post,
            order: i,
            path: body.images[i],
            type: ImageModelType.POST_IMAGE,
          },
          qr,
        );
      }

      // 실제 모든 쿼리로 DB에 저장된다.
      await qr.commitTransaction();
      // 쿼리 러너 종료
      await qr.release();

      return this.postsService.getPostById(post.id);
    } catch (e) {
      // 어떤 에러든 에러가 던져지면 트랜잭션을 종료하고 원래 상태로 되돌린다.
      await qr.rollbackTransaction();
      // 쿼리 러너 종료
      await qr.release();

      throw new InternalServerErrorException('에러가 발생했습니다.');
    }
  }

  @Patch(':id')
  patchPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
