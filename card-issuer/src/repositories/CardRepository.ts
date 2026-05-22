import { getDatabase } from '../database/db';
import { CardIssueRecord } from '../models/Card';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('CardRepository');

export class CardRepository {
  async saveCardRequest(record: CardIssueRecord): Promise<void> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const {
        id,
        requestId,
        customer,
        product,
        status,
        createdAt,
        updatedAt,
      } = record;

      const query = `
        INSERT INTO card_issues (
          id, requestId, documentType, documentNumber, fullName, age, email,
          cardType, currency, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const customerData = JSON.parse(customer);
      const productData = JSON.parse(product);

      const params = [
        id,
        requestId,
        customerData.documentType,
        customerData.documentNumber,
        customerData.fullName,
        customerData.age,
        customerData.email,
        productData.type,
        productData.currency,
        status,
        createdAt,
        updatedAt,
      ];

      db.run(query, params, function (err) {
        if (err) {
          logger.error('Error saving card request', err);
          reject(err);
        } else {
          logger.log(`Card request saved with ID: ${id}`);
          resolve();
        }
      });
    });
  }

  async getCardRequestByRequestId(requestId: string): Promise<any> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM card_issues WHERE requestId = ?';

      db.get(query, [requestId], (err, row) => {
        if (err) {
          logger.error('Error fetching card request', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateCardStatus(requestId: string, status: string): Promise<void> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = 'UPDATE card_issues SET status = ?, updatedAt = ? WHERE requestId = ?';
      const updatedAt = new Date().toISOString();

      db.run(query, [status, updatedAt, requestId], function (err) {
        if (err) {
          logger.error('Error updating card status', err);
          reject(err);
        } else {
          logger.log(`Card request ${requestId} status updated to ${status}`);
          resolve();
        }
      });
    });
  }

  async findByDocument(documentNumber: string): Promise<any> {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM card_issues WHERE documentNumber = ? LIMIT 1';

      db.get(query, [documentNumber], (err, row) => {
        if (err) {
          logger.error('Error fetching card request by document', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }
}
