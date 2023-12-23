import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { ImageModel } from 'src/common/entity/image.entity';
import { PostsImagesService } from './images.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostsModel, ImageModel]),
    AuthModule,
    UsersModule,
    CommonModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsImagesService],
})
export class PostsModule {}

// export class PostsModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(LogMiddleware).forRoutes({
//       // 미들웨어를 실행시키고 싶은 라우트 path (정확히 posts로 해당되는 path만 )
//       // {posts* 를하면, 모든 posts요청}
//       path: 'posts*',
//       //  어떤 HTTP 메서드에서 실행시키고 싶은지?
//       method: RequestMethod.GET,
//     });
//   }
// }
