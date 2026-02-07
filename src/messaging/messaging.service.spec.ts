import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { ExecutionService } from '../execution/execution.service';

describe('MessagingService', () => {
  let service: MessagingService;

  const mockExecutionService = {
    findByWorkOrder: jest.fn(),
    startDiagnosis: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: ExecutionService,
          useValue: mockExecutionService,
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should be a function', () => {
      expect(typeof service.publish).toBe('function');
    });
  });

  describe('subscribe', () => {
    it('should be a function', () => {
      expect(typeof service.subscribe).toBe('function');
    });
  });

  describe('setExecutionService', () => {
    it('should set execution service', () => {
      service.setExecutionService(mockExecutionService as any);
      expect(service).toBeDefined();
    });
  });
});
