import sqlite3 from 'sqlite3';
import { createLogger } from '../../../shared/logger';
import path from 'path';

const logger = createLogger('Database');
let db: sqlite3.Database;

export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, '../../../data/issuer.db');
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Error opening database', err);
        reject(err);
      } else {
        logger.log('Connected to SQLite database');
        createTables().then(resolve).catch(reject);
      }
    });
  });
}

function createTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS card_issues (
          id TEXT PRIMARY KEY,
          requestId TEXT UNIQUE NOT NULL,
          documentType TEXT NOT NULL,
          documentNumber TEXT NOT NULL,
          fullName TEXT NOT NULL,
          age INTEGER NOT NULL,
          email TEXT NOT NULL,
          cardType TEXT NOT NULL,
          currency TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
        (err) => {
          if (err) {
            logger.error('Error creating card_issues table', err);
            reject(err);
          } else {
            logger.log('card_issues table created/verified');
            resolve();
          }
        }
      );
    });
  });
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          logger.error('Error closing database', err);
          reject(err);
        } else {
          logger.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}
