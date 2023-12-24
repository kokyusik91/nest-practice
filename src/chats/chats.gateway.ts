// 소켓 연결

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  // ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  handleConnection(socket: Socket) {
    // 연결됬을때 실행된다.
    console.log(`one connect called : ${socket.id}`);
  }

  @SubscribeMessage('enter_chat')
  enterChat(
    // 방의 chat ID들을 리스트로 받는다.
    @MessageBody() data: number[],
    @ConnectedSocket() socket: Socket,
  ) {
    for (const chatId of data) {
      // socket.join()
      socket.join(chatId.toString());
    }
  }

  // 오리지널
  // socket.on('send_message', (message) => {console.log(message)})

  // nest.js 버전
  @SubscribeMessage('send_message')
  sendMessage(
    @MessageBody() message: { message: string; chatId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    // 모든 소켓들에게 메시지를 보냄
    // this.server
    //   // 방에 들어가있는 클라이언트에게만 메시지 전달
    //   .in(message.chatId.toString())
    //   .emit('receive_message', message.message);

    // 현재 연결된 소켓에만 메시지 보내기
    socket
      .to(message.chatId.toString())
      .emit('receive_message', message.message);
  }
}
