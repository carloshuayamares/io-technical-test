import { CardGenerated } from '../models/Card';
import { createLogger } from '../../../shared/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('CardGenerationService');

export class CardGenerationService {
  /**
   * Genera números de tarjeta aleatorios (formato Visa/Mastercard válido)
   */
  private generateCardNumber(cardType: string): string {
    // Prefijo según tipo de tarjeta
    let prefix: string;
    let length: number;

    if (cardType === 'VISA') {
      prefix = '4';
      length = 16;
    } else if (cardType === 'MASTERCARD') {
      prefix = '51'; // 51-55 rango Mastercard
      length = 16;
    } else if (cardType === 'AMEX') {
      prefix = '37';
      length = 15;
    } else {
      prefix = '4';
      length = 16;
    }

    // Generar dígitos aleatorios hasta el largo deseado
    let cardNumber = prefix;
    for (let i = prefix.length; i < length - 1; i++) {
      cardNumber += Math.floor(Math.random() * 10);
    }

    // Agregar dígito de verificación (algoritmo de Luhn simplificado)
    const checkDigit = this.calculateLuhnCheckDigit(cardNumber);
    cardNumber += checkDigit;

    return cardNumber;
  }

  /**
   * Calcula el dígito verificador de Luhn
   */
  private calculateLuhnCheckDigit(cardNumber: string): string {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  /**
   * Genera fecha de vencimiento (2-5 años en el futuro)
   */
  private generateExpiryDate(): string {
    const now = new Date();
    const yearsToAdd = Math.floor(Math.random() * 4) + 2; // 2-5 años
    const expiryDate = new Date(now.getFullYear() + yearsToAdd, now.getMonth());

    const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const year = String(expiryDate.getFullYear()).slice(-2);

    return `${month}/${year}`;
  }

  /**
   * Genera CVV aleatorio (3 o 4 dígitos)
   */
  private generateCVV(cardType: string): string {
    const length = cardType === 'AMEX' ? 4 : 3;
    let cvv = '';

    for (let i = 0; i < length; i++) {
      cvv += Math.floor(Math.random() * 10);
    }

    return cvv;
  }

  /**
   * Genera los datos completos de una tarjeta
   */
  generateCard(cardType: string, currency: string): CardGenerated {
    const cardData: CardGenerated = {
      cardId: uuidv4(),
      cardNumber: this.generateCardNumber(cardType),
      expiryDate: this.generateExpiryDate(),
      cvv: this.generateCVV(cardType),
      cardType,
      currency,
    };

    logger.log(`Generated card: ${cardData.cardNumber.slice(-4)} | ${cardData.expiryDate}`, cardData);

    return cardData;
  }
}
