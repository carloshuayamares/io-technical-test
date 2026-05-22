export interface Customer {
  documentType: string;
  documentNumber: string;
  fullName: string;
  age: number;
  email: string;
}

export interface Product {
  type: string;
  currency: string;
}

export interface CardIssueRequest {
  customer: Customer;
  product: Product;
  forceError?: boolean;
}

export interface CardIssueRecord {
  id: string;
  requestId: string;
  customer: string;
  product: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudEvent {
  id: string;
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
  };
}
