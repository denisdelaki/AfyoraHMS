export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';

export type PaymentStatus = 'Completed' | 'Pending' | 'Failed';

export type InvoiceItem = {
  service: string;
  amount: number;
};

export type InsuranceInfo = {
  company: string;
  coverage: number;
  claim: string;
};

export type Invoice = {
  id: string;
  patient: string;
  patientId: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  paymentMethod: string | null;
  insurance: InsuranceInfo | null;
};

export type Payment = {
  id: string;
  invoice: string;
  patient: string;
  amount: number;
  method: string;
  date: string;
  status: PaymentStatus;
};

export type NewInvoicePayload = {
  patient: string;
  items: InvoiceItem[];
  insurance: {
    company: string;
    coverage: number | null;
  } | null;
};

export type RecordPaymentPayload = {
  amount: number;
  method: string;
};
