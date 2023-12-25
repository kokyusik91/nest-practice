import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsModel } from './entity/comments.entity';

@Module({
  // CommentModel과 관련된 레포지토리 사용가능
  imports: [TypeOrmModule.forFeature([CommentsModel])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
