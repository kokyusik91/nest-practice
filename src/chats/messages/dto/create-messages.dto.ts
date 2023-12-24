import { PickType } from '@nestjs/mapped-types';
import { MessagesModel } from '../entity/message.entity';
import { IsNumber } from 'class-validator';

export class CreateMessageDto extends PickType(MessagesModel, ['message']) {
  @IsNumber()
  chatId: number;

  // 임시적으로 websoket에서 처리하기 위함.
  @IsNumber()
  authorId: number;
}
