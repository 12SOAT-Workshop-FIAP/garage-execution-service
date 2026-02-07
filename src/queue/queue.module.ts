import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [ExecutionModule],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
