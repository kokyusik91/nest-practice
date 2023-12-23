import { IsString } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { ImageModel } from 'src/common/entity/image.entity';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class PostsModel extends BaseModel {
  @ManyToOne(() => UsersModel, (user) => user.posts, {
    nullable: false,
  })
  author: UsersModel;
  @Column()
  @IsString({
    message: stringValidationMessage,
  })
  title: string;
  @Column()
  @IsString({
    message: stringValidationMessage,
  })
  content: string;

  @Column({
    nullable: true,
  })
  // 여기서 value는 이미지 이름 그자체를 의미한다. join 메서드로 /public/posts를 앞에 붙여준다. (트렌잭션을 위해 삭제)
  // @Transform(({ value }) => value && `/${join(POST_PUBLIC_IMAGE_PATH, value)}`)
  // image?: string;
  @Column()
  likeCount: number;
  @Column()
  commentCount: number;

  // 포스트 입장에서는 다수의 이미지를 받기 때문에 OneToMany
  @OneToMany(() => ImageModel, (image) => image.post)
  images: ImageModel[];
}
