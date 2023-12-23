import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { BaseModel } from './base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Transform } from 'class-transformer';
import { POST_PUBLIC_IMAGE_PATH } from '../const/path.const';
import { join } from 'path';
import { PostsModel } from 'src/posts/entities/posts.entity';

export enum ImageModelType {
  POST_IMAGE,
  // USER_IMAGE
}

@Entity()
export class ImageModel extends BaseModel {
  // 이미지를 보여주려는 순서
  @Column({
    default: 0,
  })
  @IsInt()
  @IsOptional()
  order: number;

  // UserModel -> 사용자 프로필 이미지
  // PostModel -> 게시글 이미지
  @Column({
    enum: ImageModelType,
  })
  @IsEnum(ImageModelType)
  @IsString()
  type: ImageModelType;

  // 이미지 경로
  @Column()
  @IsString()
  // obj는 현재 ImageModel
  @Transform(({ value, obj }) => {
    // 타입이 포스트 이미지면, /public/posts 하위 경로 설정
    if (obj.type === ImageModelType.POST_IMAGE) {
      return `/${join(POST_PUBLIC_IMAGE_PATH, value)}`;
    } else {
      return value;
    }
  })
  path: string;

  // 이미지 모델 입장에서는 하나의 포스트의 다수가 연결된다.
  @ManyToOne(() => PostsModel, (post) => post.images)
  post?: PostsModel;
}
