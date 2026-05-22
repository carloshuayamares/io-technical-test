import { KafkaConsumerService, KAFKA_TOPICS } from '../../../shared/kafka';
import { CardProcessingService } from '../services/CardProcessingService';
import { CardIssueRequest } from '../models/Card';
import { createLogger } from '../../../shared/logger';
import { EachMessagePayload } from 'kafkajs';

const logger = createLogger('CardConsumer');

export class CardConsumer {
  private consumerService: KafkaConsumerService;
  private processingService: CardProcessingService;
  private readonly groupId = 'card-processor-group';

  constructor() {
    this.consumerService = new KafkaConsumerService(this.groupId);
    this.processingService = new CardProcessingService();
  }

  async start(): Promise<void> {
    try {
      logger.log('Starting Card Consumer...');

      // Conectar al producer (para publicar eventos)
      await this.processingService.connect();

      // Conectar al consumer
      await this.consumerService.connect();

      // Suscribirse al topic
      await this.consumerService.subscribe({
        topics: [KAFKA_TOPICS.CARD_REQUESTED],
        fromBeginning: false,
      });

      logger.log(`Subscribed to topic: ${KAFKA_TOPICS.CARD_REQUESTED}`);

      // Iniciar consumo
      await this.consumerService.run(this.handleMessage.bind(this));
    } catch (error) {
      logger.error('Error starting consumer', error);
      throw error;
    }
  }

  /**
   * Maneja cada mensaje recibido
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;

    try {
      if (!message.value) {
        logger.warn('Received empty message');
        return;
      }

      const eventData = JSON.parse(message.value.toString());
      logger.log(`Received message from topic: ${topic}`, eventData);

      // Validar que sea un CloudEvent válido
      if (!eventData.id || !eventData.type || !eventData.data) {
        logger.error('Invalid CloudEvent format', eventData);
        return;
      }

      // Procesar la solicitud de tarjeta
      if (eventData.type === KAFKA_TOPICS.CARD_REQUESTED) {
        await this.processingService.processCardIssueRequest(eventData as CardIssueRequest);
      }
    } catch (error) {
      logger.error('Error processing message', error);
      // No relanzar el error para que el consumer siga funcionando
    }
  }

  async stop(): Promise<void> {
    logger.log('Stopping Card Consumer...');
    await this.consumerService.disconnect();
    await this.processingService.disconnect();
    logger.log('Card Consumer stopped');
  }
}
