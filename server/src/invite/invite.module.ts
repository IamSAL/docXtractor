import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invite, User])],
  providers: [InviteService, UserService, AuthService],
  controllers: [InviteController],
  exports: [InviteService],
})
export class InviteModule {}
