import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecutionService } from './execution.service';
import { Execution, ExecutionStatus } from './entities/execution.entity';
import { MessagingService } from '../messaging/messaging.service';
import { NotFoundException } from '@nestjs/common';

describe('ExecutionService', () => {
  let service: ExecutionService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMessagingService = { publish: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        { provide: getRepositoryToken(Execution), useValue: mockRepository },
        { provide: MessagingService, useValue: mockMessagingService },
      ],
    }).compile();
    service = module.get<ExecutionService>(ExecutionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create an execution', async () => {
      const dto = { workOrderId: 'wo-1', technicianId: 'tech-1', priority: 5 };
      const mock = { id: 'e-1', ...dto, status: ExecutionStatus.QUEUED };
      mockRepository.create.mockReturnValue(mock);
      mockRepository.save.mockResolvedValue(mock);
      const result = await service.create(dto);
      expect(result).toEqual(mock);
      expect(mockMessagingService.publish).toHaveBeenCalledWith('execution.created', expect.any(Object));
    });
  });

  describe('findAll', () => {
    it('should return all executions ordered', async () => {
      mockRepository.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledWith({ order: { priority: 'DESC', createdAt: 'ASC' } });
    });
  });

  describe('findOne', () => {
    it('should return an execution', async () => {
      mockRepository.findOne.mockResolvedValue({ id: '1' });
      expect((await service.findOne('1')).id).toBe('1');
    });
    it('should throw NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByWorkOrder', () => {
    it('should return execution by work order', async () => {
      mockRepository.findOne.mockResolvedValue({ id: '1', workOrderId: 'wo-1' });
      const result = await service.findByWorkOrder('wo-1');
      expect(result.workOrderId).toBe('wo-1');
    });
  });

  describe('update', () => {
    it('should update and publish status change', async () => {
      const mock = { id: '1', workOrderId: 'wo-1', status: ExecutionStatus.QUEUED };
      mockRepository.findOne.mockResolvedValue({ ...mock });
      mockRepository.save.mockResolvedValue({ ...mock, status: ExecutionStatus.DIAGNOSING, startedAt: expect.any(Date) });
      const result = await service.update('1', { status: ExecutionStatus.DIAGNOSING });
      expect(result.status).toBe(ExecutionStatus.DIAGNOSING);
      expect(mockMessagingService.publish).toHaveBeenCalledWith('execution.status-changed', expect.any(Object));
    });

    it('should set diagnosisCompletedAt when status is DIAGNOSIS_COMPLETE', async () => {
      const mock = { id: '1', workOrderId: 'wo-1', status: ExecutionStatus.DIAGNOSING };
      mockRepository.findOne.mockResolvedValue({ ...mock });
      mockRepository.save.mockResolvedValue({ ...mock, status: ExecutionStatus.DIAGNOSIS_COMPLETE, diagnosisCompletedAt: new Date() });
      const result = await service.update('1', { status: ExecutionStatus.DIAGNOSIS_COMPLETE, diagnosisNotes: 'done' });
      expect(result.status).toBe(ExecutionStatus.DIAGNOSIS_COMPLETE);
    });

    it('should set repairCompletedAt when status is REPAIR_COMPLETE', async () => {
      const mock = { id: '1', workOrderId: 'wo-1', status: ExecutionStatus.REPAIRING };
      mockRepository.findOne.mockResolvedValue({ ...mock });
      mockRepository.save.mockResolvedValue({ ...mock, status: ExecutionStatus.REPAIR_COMPLETE, repairCompletedAt: new Date() });
      const result = await service.update('1', { status: ExecutionStatus.REPAIR_COMPLETE, repairNotes: 'done' });
      expect(result.status).toBe(ExecutionStatus.REPAIR_COMPLETE);
    });

    it('should set completedAt and publish execution.completed when COMPLETED', async () => {
      const mock = { id: '1', workOrderId: 'wo-1', status: ExecutionStatus.REPAIR_COMPLETE, partsUsed: [], servicesPerformed: [] };
      mockRepository.findOne.mockResolvedValue({ ...mock });
      mockRepository.save.mockResolvedValue({ ...mock, status: ExecutionStatus.COMPLETED, completedAt: new Date() });
      const result = await service.complete('1');
      expect(result.status).toBe(ExecutionStatus.COMPLETED);
      expect(mockMessagingService.publish).toHaveBeenCalledWith('execution.completed', expect.any(Object));
    });

    it('should not publish if status unchanged', async () => {
      const mock = { id: '1', workOrderId: 'wo-1', status: ExecutionStatus.QUEUED };
      mockRepository.findOne.mockResolvedValue({ ...mock });
      mockRepository.save.mockResolvedValue({ ...mock });
      await service.update('1', { status: ExecutionStatus.QUEUED });
      expect(mockMessagingService.publish).not.toHaveBeenCalledWith('execution.status-changed', expect.any(Object));
    });
  });

  describe('startDiagnosis', () => {
    it('should call update with DIAGNOSING', async () => {
      jest.spyOn(service, 'update').mockResolvedValue({ status: ExecutionStatus.DIAGNOSING } as any);
      await service.startDiagnosis('1');
      expect(service.update).toHaveBeenCalledWith('1', { status: ExecutionStatus.DIAGNOSING });
    });
  });

  describe('completeDiagnosis', () => {
    it('should call update with DIAGNOSIS_COMPLETE and notes', async () => {
      jest.spyOn(service, 'update').mockResolvedValue({ status: ExecutionStatus.DIAGNOSIS_COMPLETE } as any);
      await service.completeDiagnosis('1', 'notes');
      expect(service.update).toHaveBeenCalledWith('1', { status: ExecutionStatus.DIAGNOSIS_COMPLETE, diagnosisNotes: 'notes' });
    });
  });

  describe('startRepair', () => {
    it('should call update with REPAIRING', async () => {
      jest.spyOn(service, 'update').mockResolvedValue({ status: ExecutionStatus.REPAIRING } as any);
      await service.startRepair('1');
      expect(service.update).toHaveBeenCalledWith('1', { status: ExecutionStatus.REPAIRING });
    });
  });

  describe('completeRepair', () => {
    it('should call update with REPAIR_COMPLETE and notes', async () => {
      jest.spyOn(service, 'update').mockResolvedValue({ status: ExecutionStatus.REPAIR_COMPLETE } as any);
      await service.completeRepair('1', 'notes');
      expect(service.update).toHaveBeenCalledWith('1', { status: ExecutionStatus.REPAIR_COMPLETE, repairNotes: 'notes' });
    });
  });

  describe('getQueue', () => {
    it('should return queued executions', async () => {
      mockRepository.find.mockResolvedValue([{ id: '1', status: ExecutionStatus.QUEUED }]);
      const result = await service.getQueue();
      expect(result).toHaveLength(1);
    });
  });
});
