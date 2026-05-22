import { v4 as uuidv4 } from 'uuid';
import { CardIssueRequest, CardIssueRecord } from '../models/Card';
import { CardRepository } from '../repositories/CardRepository';
import { HttpError } from '../errors/HttpError';
import { CardEventProducer } from '../kafka/CardProducer';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('CardService');

export class CardService {
  private cardRepository: CardRepository;
  private cardProducer: CardEventProducer;

  constructor() {
    this.cardRepository = new CardRepository();
    this.cardProducer = new CardEventProducer();
  }

  async initializeProducer(): Promise<void> {
    await this.cardProducer.connect();
  }

  async issueCard(request: CardIssueRequest): Promise<{ requestId: string; status: string }> {
    try {
      // Verificar si el cliente ya tiene una solicitud/tarjeta por documentNumber
      const existing = await this.cardRepository.findByDocument(request.customer.documentNumber);
      if (existing) {
        throw new HttpError(409, 'Client already has a card request or issued card', 'CONFLICT');
      }

      const requestId = uuidv4();
      const now = new Date().toISOString();

      // Crear registro
      const record: CardIssueRecord = {
        id: uuidv4(),
        requestId,
        customer: JSON.stringify(request.customer),
        product: JSON.stringify(request.product),
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      };

      // Guardar en base de datos
      await this.cardRepository.saveCardRequest(record);
      logger.log(`Card request saved: ${requestId}`);

      // Publicar evento en Kafka
      await this.cardProducer.publishCardRequestedEvent(
        requestId,
        request.customer,
        request.product
      );

      return {
        requestId,
        status: 'PENDING',
      };
    } catch (error) {
      logger.error('Error issuing card', error);
      throw error;
    }
  }

  async getCardRequestStatus(requestId: string): Promise<any> {
    try {
      const record = await this.cardRepository.getCardRequestByRequestId(requestId);
      if (!record) {
        throw new Error('Card request not found');
      }
      return record;
    } catch (error) {
      logger.error('Error getting card request status', error);
      throw error;
    }
  }
}
