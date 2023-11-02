import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PostsModel {
  // 자동으로 postsql에서 자동으로 id를 1씩 올려준다. + 유니크한 id값
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  author: string;
  @Column()
  title: string;
  @Column()
  content: string;
  @Column()
  likeCount: number;
  @Column()
  commentCount: number;
}
