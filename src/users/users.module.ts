import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsersModel])],
  // 다른 모듈에서 import 할수 있게 된다.
  exports: [UsersService],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
