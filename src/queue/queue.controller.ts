import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QueueService } from './queue.service';

@ApiTags('queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @ApiOperation({ summary: 'Ver fila de execução' })
  getQueue() {
    return this.queueService.getQueue();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Estatísticas da fila' })
  getStatistics() {
    return this.queueService.getQueueStatistics();
  }
}
