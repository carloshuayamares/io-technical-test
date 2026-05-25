import sqlite3 from 'sqlite3';
import { createLogger } from '../../../shared/logger';
import path from 'path';
import fs from 'fs';

const logger = createLogger('Database');
let db: sqlite3.Database;

export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Usar process.cwd() para obtener la raíz del proyecto
    // Si se ejecuta desde card-issuer/, subir un nivel
    const dataDir = path.join(process.cwd(), '../data');
    const dbPath = path.join(dataDir, 'issuer.db');
    
    // Crear carpeta data si no existe
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.log(`Created data directory: ${dataDir}`);
    }
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Error opening database', err);
        reject(err);
      } else {
        logger.log(`Connected to SQLite database at ${dbPath}`);
        createTables().then(resolve).catch(reject);
      }
    });
  });
}

function createTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS card_issuer (
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
          forceError INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
        (err) => {
          if (err) {
            logger.error('Error creating card_issuer table', err);
            reject(err);
          } else {
            logger.log('card_issuer table created/verified');
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
