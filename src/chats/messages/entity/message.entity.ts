import { IsString } from 'class-validator';
import { ChatsModel } from 'src/chats/entities/chat.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class MessagesModel extends BaseModel {
  // 어떤 채팅방에서 작성된 메시지인지?
  @ManyToOne(() => ChatsModel, (chat) => chat.messages)
  chat: ChatsModel;

  // 어떤 유저가 작성한 메시지인지?
  // 유저 하나가 여러 메시지를 보낸다.
  @ManyToOne(() => UsersModel, (user) => user.messages)
  author: UsersModel;

  @Column()
  @IsString()
  message: string;
}
