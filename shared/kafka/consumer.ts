import { Consumer, ConsumerSubscribeTopics, EachMessagePayload } from 'kafkajs';
import { getConsumer } from './client';

export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

export class KafkaConsumerService {
  private consumer: Consumer;
  private isConnected = false;
  private groupId: string;

  constructor(groupId: string) {
    this.groupId = groupId;
    this.consumer = getConsumer(groupId);
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
    }
  }

  async subscribe(topics: string[] | ConsumerSubscribeTopics): Promise<void> {
    await this.connect();

    const subscriptionTopics = Array.isArray(topics)
      ? { topics, fromBeginning: false }
      : topics;

    await this.consumer.subscribe(subscriptionTopics);
  }

  async run(messageHandler: MessageHandler): Promise<void> {
    await this.connect();

    await this.consumer.run({
      eachMessage: messageHandler,
    });
  }
}
