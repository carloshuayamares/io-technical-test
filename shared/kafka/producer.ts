import { Producer, ProducerRecord } from 'kafkajs';
import { getProducer } from './client';

export class KafkaProducerService {
  private producer: Producer;
  private isConnected = false;

  constructor() {
    this.producer = getProducer();
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  async sendMessage(topic: string, message: any, key?: string): Promise<void> {
    await this.connect();

    const record: ProducerRecord = {
      topic,
      messages: [
        {
          key: key || Date.now().toString(),
          value: JSON.stringify(message),
          headers: {
            'content-type': 'application/json',
            timestamp: new Date().toISOString(),
          },
        },
      ],
    };

    await this.producer.send(record);
  }

  async sendBatch(topic: string, messages: any[]): Promise<void> {
    await this.connect();

    const record: ProducerRecord = {
      topic,
      messages: messages.map((msg, index) => ({
        key: msg.key || index.toString(),
        value: JSON.stringify(msg.value),
        headers: {
          'content-type': 'application/json',
          timestamp: new Date().toISOString(),
        },
      })),
    };

    await this.producer.send(record);
  }
}
