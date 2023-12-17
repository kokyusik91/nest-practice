import { Column, Entity, OneToMany } from 'typeorm';
import { RoleEnum } from '../const/roles.const';
import { PostsModel } from 'src/posts/entities/posts.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';

import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { Exclude } from 'class-transformer';

@Entity()
export class UsersModel extends BaseModel {
  @Column({
    length: 20,
    unique: true,
  })
  @IsString({
    message: stringValidationMessage,
  })
  @Length(1, 20, {
    message: lengthValidationMessage,
  })
  // 1. 길이가 20을 넘지 않을 것
  // 2. 유일무이한 값이 될것
  nickname: string;

  // @Expose()
  // get nicknameAndEmail() {
  //   return this.nickname + '/' + this.email;
  // }

  @Column({
    unique: true,
  })
  @IsString({
    message: stringValidationMessage,
  })
  @IsEmail(
    {},
    {
      message: emailValidationMessage,
    },
  )
  // 1. 유일무이한 값이 될것
  email: string;

  @Column({
    type: 'enum',
    enum: Object.values(RoleEnum),
    default: RoleEnum.USER,
  })
  role: RoleEnum;

  @Column()
  @IsString({
    message: stringValidationMessage,
  })
  @Length(3, 8, { message: lengthValidationMessage })
  @Exclude({
    toPlainOnly: true,
  })
  password: string;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];
}
