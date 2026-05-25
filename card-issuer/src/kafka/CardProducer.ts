import { KafkaProducerService, KAFKA_TOPICS, createCloudEvent } from '../../../shared/kafka';
import { createLogger } from '../../../shared/logger';

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
    productData: any,
    forceError?: boolean,
    source?: string
  ): Promise<void> {
    try {
      const data = {
        documentType: customerData.documentType,
        documentNumber: customerData.documentNumber,
        fullName: customerData.fullName,
        age: customerData.age,
        email: customerData.email,
        cardType: productData.type,
        currency: productData.currency,
        // Incluir flag de pruebas si viene desde la petición
        ...(typeof forceError !== 'undefined' ? { forceError } : {}),
      };

      const cloudEvent: any = createCloudEvent(KAFKA_TOPICS.CARD_REQUESTED, data, source || requestId);

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
