import { getDatabase } from '../database/db';
import { CardRecord } from '../models/Card';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('CardRepository');

export class CardRepository {
  async saveIssuedCard(record: CardRecord): Promise<void> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO issued_cards (
          id, requestId, cardNumber, expiryDate, cvv,
          documentNumber, email, cardType, currency, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      const query = 'SELECT * FROM issued_cards WHERE requestId = ?';

      db.get(query, [requestId], (err, row) => {
        if (err) {
          logger.error('Error fetching card', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }
}
