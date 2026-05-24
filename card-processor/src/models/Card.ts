export interface CardIssueRequest {
  id: number | string;
  source: string;
  type: string;
  datacontenttype: string;
  time: string;
  data: {
    documentType: string;
    documentNumber: string;
    fullName: string;
    age: number;
    email: string;
    cardType: string;
    currency: string;
    forceError?: boolean;
  };
}

export interface CardGenerated {
  cardId: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardType: string;
  currency: string;
}

export interface CardProcessingResult {
  requestId: string;
  cardData?: CardGenerated;
  error?: string;
  retryCount: number;
  forceError?: boolean;
}

export interface CardIssuedEvent {
  id: number | string;
  source: string;
  type: string;
  datacontenttype: string;
  time: string;
  data: {
    cardId: string;
    requestId: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    documentNumber: string;
    email: string;
    cardType: string;
    currency: string;
    status: string;
  };
}

export interface DLQMessage {
  id: number | string;
  source: string;
  type: string;
  datacontenttype: string;
  time: string;
  data: {
    originalRequestId: string;
    originalPayload: CardIssueRequest;
    error: string;
    retryCount: number;
    reason: string;
  };
}

export interface CardRecord {
  id: string;
  requestId: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  documentNumber: string;
  email: string;
  cardType: string;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
