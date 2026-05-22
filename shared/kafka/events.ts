export interface CardRequestedEvent {
  id: string;
  userId: string;
  cardType: string;
  requestedAt: string;
  metadata?: Record<string, any>;
}

export interface CardIssuedEvent {
  id: string;
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
