import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { ExecutionService } from '../execution/execution.service';
import { ExecutionStatus } from '../execution/entities/execution.entity';

describe('QueueService', () => {
  let service: QueueService;
  let executionService: ExecutionService;

  const mockExecutionService = {
    getQueue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: ExecutionService,
          useValue: mockExecutionService,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    executionService = module.get<ExecutionService>(ExecutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQueue', () => {
    it('should return queue from execution service', async () => {
      const mockQueue = [
        { id: '1', status: ExecutionStatus.QUEUED },
        { id: '2', status: ExecutionStatus.DIAGNOSING },
      ];

      mockExecutionService.getQueue.mockResolvedValue(mockQueue);

      const result = await service.getQueue();

      expect(result).toEqual(mockQueue);
      expect(executionService.getQueue).toHaveBeenCalled();
    });
  });

  describe('getQueueStatistics', () => {
    it('should return statistics about the queue', async () => {
      const now = Date.now();
      const mockQueue = [
        {
          id: '1',
          status: ExecutionStatus.QUEUED,
          createdAt: new Date(now - 60000),
        },
        {
          id: '2',
          status: ExecutionStatus.DIAGNOSING,
          createdAt: new Date(now - 30000),
        },
        {
          id: '3',
          status: ExecutionStatus.REPAIRING,
          createdAt: new Date(now - 120000),
        },
      ];

      mockExecutionService.getQueue.mockResolvedValue(mockQueue);

      const result = await service.getQueueStatistics();

      expect(result).toHaveProperty('total', 3);
      expect(result).toHaveProperty('byStatus');
      expect(result.byStatus.queued).toBe(1);
      expect(result.byStatus.diagnosing).toBe(1);
      expect(result.byStatus.repairing).toBe(1);
      expect(result).toHaveProperty('averageWaitTime');
    });

    it('should handle empty queue', async () => {
      mockExecutionService.getQueue.mockResolvedValue([]);

      const result = await service.getQueueStatistics();

      expect(result.total).toBe(0);
      expect(result.averageWaitTime).toBe(0);
    });
  });
});
