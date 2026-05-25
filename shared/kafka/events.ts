import { v4 as uuidv4 } from 'uuid';

export interface CardRequestedEvent {
  id: number | string;
  userId: string;
  cardType: string;
  requestedAt: string;
  metadata?: Record<string, any>;
}

export interface CardIssuedEvent {
  id: number | string;
  cardNumber: string;
  userId: string;
  issueDate: string;
  expiryDate: string;
  cardRequestId: string;
  metadata?: Record<string, any>;
}

export interface DLQMessage {
  originalTopic: string;
  originalMessage: any;
  error: string;
  retryCount: number;
  timestamp: string;
}

let eventCounter = 0;
const defaultRunSource = uuidv4();

export function createCloudEvent(type: string, data: any, source?: string) {
  eventCounter += 1;
  return {
    id: eventCounter,
    source: source || defaultRunSource,
    type,
    datacontenttype: 'application/json',
    time: new Date().toISOString(),
    data,
  };
}

export function getCurrentRunSource() {
  return defaultRunSource;
}
