import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsModel } from './entities/chat.entity';
import { CommonModule } from 'src/common/common.module';
import { ChatsMessagesService } from './messages/message.service';
import { MessagesModel } from './messages/entity/message.entity';
import { MessagesController } from './messages/message.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatsModel, MessagesModel]),
    CommonModule,
  ],
  controllers: [ChatsController, MessagesController],
  providers: [ChatsGateway, ChatsService, ChatsMessagesService],
})
export class ChatsModule {}
