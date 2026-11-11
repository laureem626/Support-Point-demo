import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NextsmsService } from './service/nextsms.service';

@Module({
  imports: [HttpModule],
  providers: [NextsmsService],
  exports: [NextsmsService],
})
export class MessagesModule {}