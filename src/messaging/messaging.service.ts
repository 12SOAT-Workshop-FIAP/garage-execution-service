import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ExecutionService } from '../execution/execution.service';

@Injectable()
export class MessagingService implements OnModuleInit {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private executionService: ExecutionService;

  async onModuleInit() {
    await this.connect();
    setTimeout(() => this.setupEventListeners(), 2000);
  }

  setExecutionService(service: ExecutionService) {
    this.executionService = service;
  }

  private async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
      this.channel = await this.connection.createChannel();
      console.log('Execution Service connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publish(routingKey: string, message: any): Promise<void> {
    if (!this.channel) return;
    const exchange = 'garage-events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  }

  async subscribe(queue: string, routingKey: string, handler: (msg: any) => void): Promise<void> {
    if (!this.channel) return;
    const exchange = 'garage-events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, routingKey);

    this.channel.consume(queue, async (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        await handler(content);
        this.channel.ack(msg);
      }
    });
  }

  private async setupEventListeners() {
    await this.subscribe('execution-payment-approved', 'payment.approved', async (data) => {
      console.log('Payment approved - starting diagnosis:', data.workOrderId);
      if (this.executionService) {
        const execution = await this.executionService.findByWorkOrder(data.workOrderId);
        if (execution) {
          await this.executionService.startDiagnosis(execution.id);
        }
      }
    });

    await this.subscribe('execution-quote-approved', 'quote.approved', async (data) => {
      console.log('Quote approved - preparing execution:', data.workOrderId);
    });

    await this.subscribe('execution-work-order-cancelled', 'work-order.cancelled', async (data) => {
      console.log(
        'Work order cancelled - saga compensation: cancelling execution:',
        data.workOrderId,
      );
      if (this.executionService) {
        const execution = await this.executionService.findByWorkOrder(data.workOrderId);
        if (execution) {
          await this.executionService.update(execution.id, { status: 'FAILED' as any });
          await this.publish('execution.failed', {
            executionId: execution.id,
            workOrderId: data.workOrderId,
            reason: 'Work order cancelled',
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
  }
}
