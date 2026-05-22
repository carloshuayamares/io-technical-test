import { KafkaProducerService, KAFKA_TOPICS } from '../../../shared/kafka';
import { createLogger } from '../../../shared/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('CardProducer');

export class CardEventProducer {
  private producerService: KafkaProducerService;

  constructor() {
    this.producerService = new KafkaProducerService();
  }

  async connect(): Promise<void> {
    await this.producerService.connect();
  }

  async disconnect(): Promise<void> {
    await this.producerService.disconnect();
  }

  async publishCardRequestedEvent(
    requestId: string,
    customerData: any,
    productData: any
  ): Promise<void> {
    try {
      const cloudEvent: any = {
        id: uuidv4(),
        source: requestId,
        type: KAFKA_TOPICS.CARD_REQUESTED,
        datacontenttype: 'application/json',
        time: new Date().toISOString(),
        data: {
          documentType: customerData.documentType,
          documentNumber: customerData.documentNumber,
          fullName: customerData.fullName,
          age: customerData.age,
          email: customerData.email,
          cardType: productData.type,
          currency: productData.currency,
        },
      };

      await this.producerService.sendMessage(
        KAFKA_TOPICS.CARD_REQUESTED,
        cloudEvent,
        requestId
      );

      logger.log(`Event published for requestId: ${requestId}`);
    } catch (error) {
      logger.error('Error publishing card requested event', error);
      throw error;
    }
  }
}
