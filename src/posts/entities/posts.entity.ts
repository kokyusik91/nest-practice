import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PostsModel {
  // 자동으로 postsql에서 자동으로 id를 1씩 올려준다. + 유니크한 id값
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => UsersModel, (user) => user.posts, {
    nullable: false,
  })
  author: UsersModel;
  @Column()
  title: string;
  @Column()
  content: string;
  @Column()
  likeCount: number;
  @Column()
  commentCount: number;
}
