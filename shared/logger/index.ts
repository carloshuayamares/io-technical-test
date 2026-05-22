export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  log(message: string, data?: any): void {
    console.log(`[${new Date().toISOString()}] [${this.context}] ${message}`, data || '');
  }

  error(message: string, error?: any): void {
    console.error(`[${new Date().toISOString()}] [${this.context}] ERROR: ${message}`, error || '');
  }

  warn(message: string, data?: any): void {
    console.warn(`[${new Date().toISOString()}] [${this.context}] WARN: ${message}`, data || '');
  }

  debug(message: string, data?: any): void {
    if (process.env.DEBUG === 'true') {
      console.debug(`[${new Date().toISOString()}] [${this.context}] DEBUG: ${message}`, data || '');
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
