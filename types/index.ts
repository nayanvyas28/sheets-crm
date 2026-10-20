// Lead data type definition
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  source: string;
  status: string;
  notes: string;
  followUpDate: string;
  lastCalled: string;
  callCount: number;
  createdAt: string;
  rowIndex?: number; // Google Sheet row number
}

export interface CallLog {
  timestamp: string;
  outcome: string;
  notes: string;
}

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Not Interested'
  | 'Converted'
  | 'Lost';
