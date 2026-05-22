import express from 'express';
import { initializeDatabase, closeDatabase } from './database/db';
import cardRoutes from './controllers/CardController';
import { createLogger } from '../../shared/logger';

const logger = createLogger('CardIssuerApp');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Routes
app.use('/cards', cardRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
});

// Graceful shutdown
async function shutdown() {
  logger.log('Shutting down server...');
  await closeDatabase();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function startServer() {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    logger.log('Database initialized');

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.log(`Card Issuer service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
