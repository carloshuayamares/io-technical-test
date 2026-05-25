import Joi from 'joi';
import { CardIssueRequest } from '../models/Card';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('CardValidator');

const cardIssueSchema = Joi.object({
  customer: Joi.object({
    documentType: Joi.string().required().valid('DNI'),
    documentNumber: Joi.string().required().alphanum().min(8).max(8),
    fullName: Joi.string().required().min(3).max(100),
    age: Joi.number().required().integer().min(18).max(120),
    email: Joi.string().required().email(),
  }).required(),
  product: Joi.object({
    type: Joi.string().required().valid('VISA'),
    currency: Joi.string().required().valid('USD', 'PEN'),
  }).required(),
  forceError: Joi.boolean().optional(),
}).unknown(false);

export function validateCardIssueRequest(payload: any): { valid: boolean; error?: string; data?: CardIssueRequest } {
  try {
    const { error, value } = cardIssueSchema.validate(payload);
    
    if (error) {
      const errorMessage = error.details.map(d => d.message).join('; ');
      logger.warn('Validation failed', errorMessage);
      return { valid: false, error: errorMessage };
    }

    logger.log('Payload validation successful');
    return { valid: true, data: value as CardIssueRequest };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown validation error';
    logger.error('Validation error', err);
    return { valid: false, error: errorMessage };
  }
}
