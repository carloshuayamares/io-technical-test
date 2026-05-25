import { getDatabase } from '../database/db';
import { CardRecord } from '../models/Card';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('CardRepository');

export class CardRepository {
  async saveIssuedCard(record: CardRecord): Promise<void> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO card_processor (
          id, requestId, cardNumber, expiryDate, cvv,
          documentNumber, email, cardType, currency, status, retryCount, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        record.id,
        record.requestId,
        record.cardNumber,
        record.expiryDate,
        record.cvv,
        record.documentNumber,
        record.email,
        record.cardType,
        record.currency,
        record.status,
        record.retryCount,
        record.createdAt,
        record.updatedAt,
      ];

      db.run(query, params, function (err) {
        if (err) {
          logger.error('Error saving issued card', err);
          reject(err);
        } else {
          logger.log(`Card saved with ID: ${record.id}`);
          resolve();
        }
      });
    });
  }

  async getCardByRequestId(requestId: string): Promise<CardRecord | null> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM card_processor WHERE requestId = ?';

      db.get(query, [requestId], (err, row) => {
        if (err) {
          logger.error('Error fetching card', err);
          reject(err);
        } else {
          resolve((row as CardRecord) || null);
        }
      });
    });
  }

  async findByDocument(documentNumber: string): Promise<CardRecord | null> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM card_processor WHERE documentNumber = ? LIMIT 1';

      db.get(query, [documentNumber], (err, row) => {
        if (err) {
          logger.error('Error fetching card by document', err);
          reject(err);
        } else {
          resolve((row as CardRecord) || null);
        }
      });
    });
  }
}
