import { Router, Request, Response } from 'express';
import { CardService } from '../services/CardService';
import { validateCardIssueRequest } from '../validators/CardValidator';
import { createLogger } from '../../../shared/logger';
import { HttpError } from '../errors/HttpError';

const logger = createLogger('CardController');
const router = Router();
const cardService = new CardService();

// Inicializar el producer
cardService.initializeProducer().catch(err => {
  logger.error('Failed to initialize card producer', err);
});

router.post('/issue', async (req: Request, res: Response) => {
  try {
    logger.log('Received card issue request');

    // Validar payload
    const validation = validateCardIssueRequest(req.body);
    if (!validation.valid) {
      logger.warn(`Validation failed: ${validation.error}`);
      return res.status(400).json({
        success: false,
        error: {
          message: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Si viene forceError, registrarlo y continuar para que el microservicio
    // `card-processor` pueda manejar la simulación del fallo según corresponda.
    if (validation.data?.forceError) {
      logger.warn('Force error flag detected; continuing to process request for testing');
    }

    // Procesar solicitud
    const result = await cardService.issueCard(validation.data!);

    logger.log(`Card issued successfully with requestId: ${result.requestId}`);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in card issue endpoint', error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code || 'ERROR'
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

router.get('/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const cardRequest = await cardService.getCardRequestStatus(requestId);

    return res.status(200).json({
      success: true,
      data: cardRequest,
    });
  } catch (error) {
    logger.error('Error fetching card request', error);
    return res.status(404).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Card request not found',
        code: 'NOT_FOUND',
      },
    });
  }
});

export default router;
