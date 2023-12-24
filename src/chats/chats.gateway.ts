// 소켓 연결

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsService } from './chats.service';
import { EnterChatDto } from './dto/enter-chat.dto';
import { CreateMessageDto } from './messages/dto/create-messages.dto';
import { ChatsMessagesService } from './messages/message.service';

@WebSocketGateway({
  // ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messageService: ChatsMessagesService,
  ) {}
  @WebSocketServer()
  server: Server;
  handleConnection(socket: Socket) {
    // 연결됬을때 실행된다.
    console.log(`one connect called : ${socket.id}`);
  }

  // 채팅방을 만드는 기능
  @SubscribeMessage('create_chat')
  async createChat(
    @MessageBody() data: CreateChatDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ConnectedSocket() socket: Socket,
  ) {
    const chat = await this.chatsService.createChat(data);
    console.log(chat);
  }

  @SubscribeMessage('enter_chat')
  async enterChat(
    // 방의 chat ID들을 리스트로 받는다.
    @MessageBody() data: EnterChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
    for (const chatId of data.chatIds) {
      const exist = await this.chatsService.checkIfChatExists(chatId);

      if (!exist) {
        throw new WsException({
          message: `존재하지 않는 chat 입니다. chatId : ${chatId}`,
          code: 100,
        });
      }
    }

    socket.join(data.chatIds.map((x) => x.toString()));
  }

  // 오리지널
  // socket.on('send_message', (message) => {console.log(message)})

  // nest.js 버전
  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const chatExists = await this.chatsService.checkIfChatExists(dto.chatId);

    if (!chatExists) {
      throw new WsException(
        `존재 하지 않는 채팅방 입니다. ChatId : ${dto.chatId}`,
      );
    }
    // 모든 소켓들에게 메시지를 보냄
    // this.server
    //   // 방에 들어가있는 클라이언트에게만 메시지 전달
    //   .in(message.chatId.toString())
    //   .emit('receive_message', message.message);

    // 현재 연결된 소켓에만 메시지 보내기

    const message = await this.messageService.createMessage(dto);
    console.log(message);
    socket
      // to는 BroadCasting 기능으로 자기 자신은 제외하고, 나머지에 한테 "서버 응답을 보내는 것이다."
      .to(message.chat.id.toString())
      .emit('receive_message', message.message);
  }
}
