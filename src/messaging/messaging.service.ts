import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ExecutionService } from '../execution/execution.service';

@Injectable()
export class MessagingService implements OnModuleInit {
  private readonly logger = new Logger(MessagingService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private isConnected = false;

  constructor(
    @Inject(forwardRef(() => ExecutionService))
    private executionService: ExecutionService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.setupEventListeners();
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      this.logger.log('Execution Service connected to RabbitMQ');

      this.connection.on('close', () => {
        this.isConnected = false;
        this.logger.warn('RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.reconnect(), 5000);
      });

      this.connection.on('error', (err) => {
        this.isConnected = false;
        this.logger.error('RabbitMQ connection error:', err.message);
      });
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to connect to RabbitMQ:', error.message);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async reconnect() {
    await this.connect();
    if (this.isConnected) {
      await this.setupEventListeners();
    }
  }

  async publish(routingKey: string, message: any): Promise<void> {
    if (!this.channel) {
      this.logger.error(`Cannot publish to "${routingKey}": RabbitMQ channel not available`);
      throw new Error(`RabbitMQ channel not available for publishing to "${routingKey}"`);
    }
    const exchange = 'garage-events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  }

  async subscribe(queue: string, routingKey: string, handler: (msg: any) => void): Promise<void> {
    if (!this.channel) {
      this.logger.error(`Cannot subscribe to "${routingKey}": RabbitMQ channel not available`);
      return;
    }
    const exchange = 'garage-events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, routingKey);

    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing message from ${routingKey}:`, error.message);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private async setupEventListeners() {
    // Pagamento aprovado → iniciar diagnóstico
    await this.subscribe('execution-payment-approved', 'payment.approved', async (data) => {
      this.logger.log(`Payment approved - starting diagnosis: ${data.workOrderId}`);
      try {
        const execution = await this.executionService.findByWorkOrder(data.workOrderId);
        if (execution) {
          await this.executionService.startDiagnosis(execution.id);
          this.logger.log(`Diagnosis started for execution ${execution.id}`);
        } else {
          this.logger.warn(`No execution found for work order ${data.workOrderId}`);
        }
      } catch (error) {
        this.logger.error(`Failed to start diagnosis for work order ${data.workOrderId}:`, error.message);
      }
    });

    // Orçamento aprovado → criar execução com status QUEUED
    await this.subscribe('execution-quote-approved', 'quote.approved', async (data) => {
      this.logger.log(`Quote approved - creating execution for work order: ${data.workOrderId}`);
      try {
        const existing = await this.executionService.findByWorkOrder(data.workOrderId);
        if (existing) {
          this.logger.warn(`Execution already exists for work order ${data.workOrderId}, skipping creation`);
          return;
        }

        await this.executionService.create({
          workOrderId: data.workOrderId,
          technicianId: data.technicianId || 'unassigned',
          priority: 5,
        });
        this.logger.log(`Execution created for work order ${data.workOrderId}`);
      } catch (error) {
        this.logger.error(`Failed to create execution for work order ${data.workOrderId}:`, error.message);
      }
    });


    // Compensação de saga: cancelar execução quando OS é cancelada
    await this.subscribe('execution-work-order-cancelled', 'work-order.cancelled', async (data) => {
      this.logger.log(`Work order cancelled - cancelling execution: ${data.workOrderId}`);
      try {
        const execution = await this.executionService.findByWorkOrder(data.workOrderId);
        if (execution) {
          await this.executionService.update(execution.id, { status: 'FAILED' as any });
          await this.publish('execution.failed', {
            executionId: execution.id,
            workOrderId: data.workOrderId,
            reason: 'Work order cancelled',
            timestamp: new Date().toISOString(),
          });
          this.logger.log(`Execution ${execution.id} cancelled for work order ${data.workOrderId}`);
        }
      } catch (error) {
        this.logger.error(`Failed to cancel execution for work order ${data.workOrderId}:`, error.message);
      }
    });
  }
}
