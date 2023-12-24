import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatsModel } from './entities/chat.entity';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { PaginateChatDto } from './dto/pageinate-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    // ChatModel을 쓰겠다
    @InjectRepository(ChatsModel)
    private readonly chatsRepository: Repository<ChatsModel>,
    // chat에서 CommonService를 쓰려면, ChatModule의 imports 배열에 CommonModule을 추가해줘야한다!
    private readonly commonService: CommonService,
  ) {}

  paginateChats(dto: PaginateChatDto) {
    return this.commonService.paginate(
      dto,
      this.chatsRepository,
      {
        relations: { users: true },
      },
      'chats',
    );
  }

  async createChat(dto: CreateChatDto) {
    const chat = await this.chatsRepository.save({
      // 1, 2, 3
      // [{id : 1}, {id : 2}, {id : 3}]
      users: dto.userIds.map((id) => ({ id })),
    });

    return this.chatsRepository.findOne({
      where: {
        id: chat.id,
      },
    });
  }

  async checkIfChatExists(chatId: number) {
    const exists = await this.chatsRepository.exist({
      where: {
        id: chatId,
      },
    });

    return exists;
  }
}
