import { Module, forwardRef } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [forwardRef(() => ExecutionModule)],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
