import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

describe('QueueController', () => {
  let controller: QueueController;
  const mockService = {
    getQueue: jest.fn(),
    getQueueStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [{ provide: QueueService, useValue: mockService }],
    }).compile();
    controller = module.get<QueueController>(QueueController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should get queue', async () => {
    mockService.getQueue.mockResolvedValue([{ id: '1' }]);
    expect(await controller.getQueue()).toHaveLength(1);
  });

  it('should get statistics', async () => {
    mockService.getQueueStatistics.mockResolvedValue({ total: 5, byStatus: {} });
    const result = await controller.getStatistics();
    expect(result.total).toBe(5);
  });
});
