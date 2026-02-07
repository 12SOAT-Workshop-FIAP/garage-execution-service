import { Injectable } from '@nestjs/common';
import { ExecutionService } from '../execution/execution.service';

@Injectable()
export class QueueService {
  constructor(private executionService: ExecutionService) {}

  async getQueue() {
    return this.executionService.getQueue();
  }

  async getQueueStatistics() {
    const queue = await this.executionService.getQueue();

    return {
      total: queue.length,
      byStatus: {
        queued: queue.filter((e) => e.status === 'QUEUED').length,
        diagnosing: queue.filter((e) => e.status === 'DIAGNOSING').length,
        repairing: queue.filter((e) => e.status === 'REPAIRING').length,
      },
      averageWaitTime: this.calculateAverageWaitTime(queue),
    };
  }

  private calculateAverageWaitTime(executions: any[]): number {
    const waitingExecutions = executions.filter((e) => e.status === 'QUEUED');
    if (waitingExecutions.length === 0) return 0;

    const totalWaitTime = waitingExecutions.reduce((sum, e) => {
      const waitTime = Date.now() - new Date(e.createdAt).getTime();
      return sum + waitTime;
    }, 0);

    return Math.round(totalWaitTime / waitingExecutions.length / 1000 / 60); // minutos
  }
}
