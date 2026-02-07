import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution, ExecutionStatus } from './entities/execution.entity';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { UpdateExecutionDto } from './dto/update-execution.dto';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class ExecutionService {
  constructor(
    @InjectRepository(Execution)
    private executionRepository: Repository<Execution>,
    private messagingService: MessagingService,
  ) {}

  async create(createDto: CreateExecutionDto): Promise<Execution> {
    const execution = this.executionRepository.create(createDto);
    const saved = await this.executionRepository.save(execution);

    await this.messagingService.publish('execution.created', {
      executionId: saved.id,
      workOrderId: saved.workOrderId,
      technicianId: saved.technicianId,
      status: saved.status,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async findAll(): Promise<Execution[]> {
    return this.executionRepository.find({
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Execution> {
    const execution = await this.executionRepository.findOne({ where: { id } });
    if (!execution) {
      throw new NotFoundException(`Execution ${id} not found`);
    }
    return execution;
  }

  async findByWorkOrder(workOrderId: string): Promise<Execution> {
    return this.executionRepository.findOne({ where: { workOrderId } });
  }

  async update(id: string, updateDto: UpdateExecutionDto): Promise<Execution> {
    const execution = await this.findOne(id);
    const previousStatus = execution.status;

    Object.assign(execution, updateDto);

    if (updateDto.status === ExecutionStatus.DIAGNOSING && !execution.startedAt) {
      execution.startedAt = new Date();
    }

    if (
      updateDto.status === ExecutionStatus.DIAGNOSIS_COMPLETE &&
      !execution.diagnosisCompletedAt
    ) {
      execution.diagnosisCompletedAt = new Date();
    }

    if (updateDto.status === ExecutionStatus.REPAIR_COMPLETE && !execution.repairCompletedAt) {
      execution.repairCompletedAt = new Date();
    }

    if (updateDto.status === ExecutionStatus.COMPLETED && !execution.completedAt) {
      execution.completedAt = new Date();
    }

    const updated = await this.executionRepository.save(execution);

    if (previousStatus !== updateDto.status) {
      await this.messagingService.publish('execution.status-changed', {
        executionId: updated.id,
        workOrderId: updated.workOrderId,
        previousStatus,
        newStatus: updated.status,
        timestamp: new Date().toISOString(),
      });

      if (updateDto.status === ExecutionStatus.COMPLETED) {
        await this.messagingService.publish('execution.completed', {
          executionId: updated.id,
          workOrderId: updated.workOrderId,
          partsUsed: updated.partsUsed,
          servicesPerformed: updated.servicesPerformed,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return updated;
  }

  async startDiagnosis(id: string): Promise<Execution> {
    return this.update(id, { status: ExecutionStatus.DIAGNOSING });
  }

  async completeDiagnosis(id: string, notes: string): Promise<Execution> {
    return this.update(id, {
      status: ExecutionStatus.DIAGNOSIS_COMPLETE,
      diagnosisNotes: notes,
    });
  }

  async startRepair(id: string): Promise<Execution> {
    return this.update(id, { status: ExecutionStatus.REPAIRING });
  }

  async completeRepair(id: string, notes: string): Promise<Execution> {
    return this.update(id, {
      status: ExecutionStatus.REPAIR_COMPLETE,
      repairNotes: notes,
    });
  }

  async complete(id: string): Promise<Execution> {
    return this.update(id, { status: ExecutionStatus.COMPLETED });
  }

  async getQueue(): Promise<Execution[]> {
    return this.executionRepository.find({
      where: [
        { status: ExecutionStatus.QUEUED },
        { status: ExecutionStatus.DIAGNOSING },
        { status: ExecutionStatus.REPAIRING },
      ],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }
}
