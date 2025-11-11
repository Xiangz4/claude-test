import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

export interface EventMessage {
  eventType: string;
  eventData: any;
  timestamp: Date;
  orderId?: string;
  merchantId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly exchangeName = 'fx.events';
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitMQUrl = this.configService.get<string>(
        'RABBITMQ_URL',
        'amqp://localhost:5672',
      );

      this.logger.log(`Connecting to RabbitMQ at ${rabbitMQUrl}`);

      // Create connection manager
      this.connection = amqp.connect([rabbitMQUrl], {
        heartbeatIntervalInSeconds: 30,
        reconnectTimeInSeconds: 5,
      });

      this.connection.on('connect', () => {
        this.logger.log('Connected to RabbitMQ');
        this.isConnected = true;
      });

      this.connection.on('disconnect', (err) => {
        this.logger.warn('Disconnected from RabbitMQ', err);
        this.isConnected = false;
      });

      this.connection.on('connectFailed', (err) => {
        this.logger.error('Failed to connect to RabbitMQ', err);
        this.isConnected = false;
      });

      // Create channel wrapper
      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: ConfirmChannel) => {
          // Declare exchange
          await channel.assertExchange(this.exchangeName, 'topic', {
            durable: true,
          });

          this.logger.log(`Exchange "${this.exchangeName}" declared`);
        },
      });

      await this.channelWrapper.waitForConnect();
      this.logger.log('RabbitMQ channel ready');
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ connection', error);
      // Don't throw - allow service to start even if RabbitMQ is unavailable
    }
  }

  private async disconnect() {
    try {
      if (this.channelWrapper) {
        await this.channelWrapper.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  async publishEvent(routingKey: string, message: EventMessage): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('RabbitMQ not connected, event will be logged but not published');
      this.logger.debug('Event:', { routingKey, message });
      return false;
    }

    try {
      // Add timestamp if not present
      if (!message.timestamp) {
        message.timestamp = new Date();
      }

      await this.channelWrapper.publish(
        this.exchangeName,
        routingKey,
        message,
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        },
      );

      this.logger.debug(`Event published: ${routingKey}`, message);
      return true;
    } catch (error) {
      this.logger.error(`Failed to publish event: ${routingKey}`, error);
      return false;
    }
  }

  // Convenience methods for common events
  async publishOrderCreated(orderId: string, orderData: any): Promise<boolean> {
    return this.publishEvent('order.created', {
      eventType: 'ORDER_CREATED',
      eventData: orderData,
      orderId,
      timestamp: new Date(),
    });
  }

  async publishOrderUpdated(orderId: string, updateData: any): Promise<boolean> {
    return this.publishEvent('order.updated', {
      eventType: 'ORDER_UPDATED',
      eventData: updateData,
      orderId,
      timestamp: new Date(),
    });
  }

  async publishFxSuccess(orderId: string, executionData: any): Promise<boolean> {
    return this.publishEvent('order.fx.success', {
      eventType: 'FX_EXECUTION_COMPLETED',
      eventData: executionData,
      orderId,
      timestamp: new Date(),
    });
  }

  async publishFxFailed(orderId: string, errorData: any): Promise<boolean> {
    return this.publishEvent('order.fx.failed', {
      eventType: 'FX_EXECUTION_FAILED',
      eventData: errorData,
      orderId,
      timestamp: new Date(),
    });
  }

  async publishSettlementCompleted(orderId: string, settlementData: any): Promise<boolean> {
    return this.publishEvent('order.settlement.completed', {
      eventType: 'SETTLEMENT_COMPLETED',
      eventData: settlementData,
      orderId,
      timestamp: new Date(),
    });
  }

  getConnectionStatus(): { connected: boolean; ready: boolean } {
    return {
      connected: this.isConnected,
      ready: this.channelWrapper !== undefined,
    };
  }
}
