import { KafkaProducerService, KAFKA_TOPICS, createCloudEvent } from '../../../shared/kafka';
import { CardGenerationService } from './CardGenerationService';
import { CardRepository } from '../repositories/CardRepository';
import { CardIssueRequest, CardProcessingResult, CardIssuedEvent, DLQMessage, CardRecord } from '../models/Card';
import { createLogger } from '../../../shared/logger';


const logger = createLogger('CardProcessingService');

export class CardProcessingService {
  private producerService: KafkaProducerService;
  private cardGenerationService: CardGenerationService;
  private cardRepository: CardRepository;
  private maxRetries = 3;

  constructor() {
    this.producerService = new KafkaProducerService();
    this.cardGenerationService = new CardGenerationService();
    this.cardRepository = new CardRepository();
  }

  async connect(): Promise<void> {
    await this.producerService.connect();
  }

  async disconnect(): Promise<void> {
    await this.producerService.disconnect();
  }

  /**
   * Simula carga externa (200-500ms) con éxito/fallo aleatorio
   */
  private async simulateExternalProcessing(forceError?: boolean): Promise<boolean> {
    // Simular latencia
    const delay = Math.floor(Math.random() * 300) + 200; // 200-500ms
    await this.sleep(delay);

    // Determinar éxito/fallo
    // Si forceError es true, siempre falla
    if (forceError) {
      logger.warn('Force error flag detected');
      return false;
    }

    // 70% de éxito, 30% de fallo
    const success = Math.random() < 0.7;
    logger.log(`External processing simulation: ${success ? 'SUCCESS' : 'FAILED'}`);

    return success;
  }

  /**
   * Implementa wait con backoff exponencial
   */
  private async waitWithBackoff(attempt: number): Promise<void> {
    const delays = [1000, 2000, 4000]; // 1s, 2s, 4s
    const delay = delays[Math.min(attempt, delays.length - 1)];
    logger.log(`Waiting ${delay}ms before retry attempt ${attempt + 1}`);
    await this.sleep(delay);
  }

  /**
   * Helper para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Procesa la solicitud de emisión de tarjeta con reintentos
   */
  async processCardIssueRequest(event: CardIssueRequest): Promise<void> {
    const requestId = event.data.documentNumber; // usar documentNumber como requestId para tracking
    const originalSource = event.source;
    let lastError = '';
    let retryCount = 0;

    logger.log(`Processing card request: ${requestId}`, event);

    // Verificar si ya existe una tarjeta para este documento (regla: un cliente una tarjeta)
    try {
      const existingCard = await this.cardRepository.findByDocument(event.data.documentNumber);
      if (existingCard) {
        logger.warn(`Card already issued for document ${event.data.documentNumber}, skipping issuance.`);

        // Publicar evento indicando que ya existe (opcional: usar mismo formato de issued)
        const existingCardData = {
          cardId: existingCard.id,
          cardNumber: existingCard.cardNumber,
          expiryDate: existingCard.expiryDate,
          cvv: existingCard.cvv,
        };

        await this.publishCardIssuedEvent(requestId, existingCardData as any, event);
        return;
      }
    } catch (err) {
      logger.error('Error checking existing card by document', err);
      // continue processing; we'll attempt issuance
    }

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      retryCount = attempt + 1;

      try {
        // Simular carga externa, usar flag forceError si está presente
        const success = await this.simulateExternalProcessing(!!event.data.forceError);

        if (success) {
          // Generar tarjeta
          const cardData = this.cardGenerationService.generateCard(
            event.data.cardType,
            event.data.currency
          );

          // Guardar en DB
          const now = new Date().toISOString();
          const cardRecord: CardRecord = {
            id: cardData.cardId,
            requestId,
            cardNumber: cardData.cardNumber,
            expiryDate: cardData.expiryDate,
            cvv: cardData.cvv,
            documentNumber: event.data.documentNumber,
            email: event.data.email,
            cardType: event.data.cardType,
            currency: event.data.currency,
            status: 'ISSUED',
            createdAt: now,
            updatedAt: now,
          };

          // Guardar en base de datos
          await this.cardRepository.saveIssuedCard(cardRecord);

          // Publicar evento de éxito
          await this.publishCardIssuedEvent(requestId, cardData, event);

          logger.log(`Card issued successfully: ${requestId}`);
          return; // Exitoso, terminar
        } else {
          lastError = 'External processing failed';

          if (attempt < this.maxRetries - 1) {
            logger.warn(`Processing failed, will retry. Attempt ${attempt + 1}/${this.maxRetries}`);
            await this.waitWithBackoff(attempt);
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error processing card (attempt ${attempt + 1})`, error);

        if (attempt < this.maxRetries - 1) {
          await this.waitWithBackoff(attempt);
        }
      }
    }

    // Si llegamos aquí, el procesamiento falló después de todos los intentos
    logger.error(`Failed to process card after ${retryCount} attempts: ${requestId}`);
    await this.publishToDLQ(requestId, event, lastError, retryCount);
  }

  /**
   * Publica evento de tarjeta emitida exitosamente
   */
  private async publishCardIssuedEvent(
    requestId: string,
    cardData: any,
    originalEvent: CardIssueRequest
  ): Promise<void> {
    try {
      const data = {
        cardId: cardData.cardId,
        requestId,
        cardNumber: cardData.cardNumber,
        expiryDate: cardData.expiryDate,
        cvv: cardData.cvv,
        documentNumber: originalEvent.data.documentNumber,
        email: originalEvent.data.email,
        cardType: originalEvent.data.cardType,
        currency: originalEvent.data.currency,
        status: 'ISSUED',
      };

      const event = createCloudEvent(KAFKA_TOPICS.CARDS_ISSUED, data, originalEvent.source);

      await this.producerService.sendMessage(KAFKA_TOPICS.CARDS_ISSUED, event, requestId);
      logger.log(`Published card issued event: ${requestId}`);
    } catch (error) {
      logger.error('Error publishing card issued event', error);
      throw error;
    }
  }

  /**
   * Publica mensaje a Dead Letter Queue
   */
  private async publishToDLQ(
    requestId: string,
    originalEvent: CardIssueRequest,
    error: string,
    retryCount: number
  ): Promise<void> {
    try {
      const dlqData = {
        originalRequestId: requestId,
        originalPayload: originalEvent,
        error,
        retryCount,
        reason: `Card processing failed after ${retryCount} retry attempts. Last error: ${error}`,
      };

      const dlqMessage = createCloudEvent(KAFKA_TOPICS.CARD_REQUESTED_DLQ, dlqData, originalEvent.source || requestId);

      await this.producerService.sendMessage(
        KAFKA_TOPICS.CARD_REQUESTED_DLQ,
        dlqMessage,
        requestId
      );

      logger.log(`Published DLQ message for failed processing: ${requestId}`);
    } catch (error) {
      logger.error('Error publishing to DLQ', error);
      throw error;
    }
  }
}
