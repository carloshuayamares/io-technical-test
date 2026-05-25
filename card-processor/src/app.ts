import { initializeDatabase, closeDatabase } from './database/db';
import { CardConsumer } from './consumers/CardConsumer';
import { createLogger } from '../../shared/logger';

const logger = createLogger('CardProcessorApp');

let cardConsumer: CardConsumer;

/**
 * Graceful shutdown
 */
async function shutdown() {
  logger.log('Shutting down server...');

  if (cardConsumer) {
    await cardConsumer.stop();
  }

  await closeDatabase();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 * Función principal
 */
async function startServer() {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    logger.log('Database initialized');

    // Crear y iniciar consumer
    cardConsumer = new CardConsumer();
    await cardConsumer.start();

    logger.log('Card Processor service started and listening for events');
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
