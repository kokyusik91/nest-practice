import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoleEnum } from '../const/roles.const';
import { PostsModel } from 'src/posts/entities/posts.entity';

@Entity()
export class UsersModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 20,
    unique: true,
  })
  // 1. 길이가 20을 넘지 않을 것
  // 2. 유일무이한 값이 될것
  nickname: string;

  @Column({
    unique: true,
  })
  // 1. 유일무이한 값이 될것
  email: string;

  @Column({
    type: 'enum',
    enum: Object.values(RoleEnum),
    default: RoleEnum.USER,
  })
  role: RoleEnum;

  @Column()
  password: string;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];
}
