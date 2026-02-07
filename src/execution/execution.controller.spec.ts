import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { ExecutionStatus } from './entities/execution.entity';

describe('ExecutionController', () => {
  let controller: ExecutionController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByWorkOrder: jest.fn(),
    update: jest.fn(),
    startDiagnosis: jest.fn(),
    completeDiagnosis: jest.fn(),
    startRepair: jest.fn(),
    completeRepair: jest.fn(),
    complete: jest.fn(),
    getQueue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionController],
      providers: [{ provide: ExecutionService, useValue: mockService }],
    }).compile();
    controller = module.get<ExecutionController>(ExecutionController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('should create', async () => {
    const dto = { workOrderId: 'wo-1', technicianId: 't-1', priority: 5 };
    mockService.create.mockResolvedValue({ id: '1', ...dto });
    expect((await controller.create(dto)).id).toBe('1');
  });

  it('should findAll', async () => {
    mockService.findAll.mockResolvedValue([{ id: '1' }]);
    expect(await controller.findAll()).toHaveLength(1);
  });

  it('should getQueue', async () => {
    mockService.getQueue.mockResolvedValue([{ id: '1' }]);
    expect(await controller.getQueue()).toHaveLength(1);
  });

  it('should findOne', async () => {
    mockService.findOne.mockResolvedValue({ id: '1' });
    expect((await controller.findOne('1')).id).toBe('1');
  });

  it('should findByWorkOrder', async () => {
    mockService.findByWorkOrder.mockResolvedValue({ id: '1' });
    expect((await controller.findByWorkOrder('wo-1')).id).toBe('1');
  });

  it('should update', async () => {
    mockService.update.mockResolvedValue({ id: '1', status: ExecutionStatus.DIAGNOSING });
    expect((await controller.update('1', { status: ExecutionStatus.DIAGNOSING })).status).toBe(ExecutionStatus.DIAGNOSING);
  });

  it('should startDiagnosis', async () => {
    mockService.startDiagnosis.mockResolvedValue({ status: ExecutionStatus.DIAGNOSING });
    expect((await controller.startDiagnosis('1')).status).toBe(ExecutionStatus.DIAGNOSING);
  });

  it('should completeDiagnosis', async () => {
    mockService.completeDiagnosis.mockResolvedValue({ status: ExecutionStatus.DIAGNOSIS_COMPLETE });
    expect((await controller.completeDiagnosis('1', 'n')).status).toBe(ExecutionStatus.DIAGNOSIS_COMPLETE);
  });

  it('should startRepair', async () => {
    mockService.startRepair.mockResolvedValue({ status: ExecutionStatus.REPAIRING });
    expect((await controller.startRepair('1')).status).toBe(ExecutionStatus.REPAIRING);
  });

  it('should completeRepair', async () => {
    mockService.completeRepair.mockResolvedValue({ status: ExecutionStatus.REPAIR_COMPLETE });
    expect((await controller.completeRepair('1', 'n')).status).toBe(ExecutionStatus.REPAIR_COMPLETE);
  });

  it('should complete', async () => {
    mockService.complete.mockResolvedValue({ status: ExecutionStatus.COMPLETED });
    expect((await controller.complete('1')).status).toBe(ExecutionStatus.COMPLETED);
  });
});
