export interface User {
  id: string;
  username: string;
  role: 'grand_admin' | 'admin' | 'user';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum RoutePath {
  LOGIN = '/login',
  DASHBOARD = '/',
  USERS = '/users',
  ANALYTICS = '/analytics'
}

export interface FormSubmission {
  id: string;
  source: string;
  timestamp: string;
  status: 'processed' | 'pending' | 'flagged';
  ipAddress: string;
  payload: Record<string, any>;
}

export interface StoredCredential {
  id: string;
  clientName: string;
  serviceName: string; // CRM Name
  crmLink: string;
  username: string; // Login Email
  password: string;
  lastUpdated: Date;
}