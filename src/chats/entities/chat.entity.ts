import { BaseModel } from 'src/common/entity/base.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { Entity, ManyToMany } from 'typeorm';

export class Chat {}

@Entity()
export class ChatsModel extends BaseModel {
  @ManyToMany(() => UsersModel, (user) => user.chats)
  users: UsersModel[];
}
