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

export type PharmacyChargeItem = {
  service: string;
  amount: number;
  drug_name?: string;
  quantity?: number;
  unit_price?: number;
  prescription_id?: string;
  date?: string;
};

export type PatientPharmacyChargesData = {
  patientId: string;
  patientName: string;
  facilityId: string | number;
  totalAmount: number;
  items: PharmacyChargeItem[];
};

export type LabChargeItem = {
  service: string;
  amount: number;
  test_name?: string;
  unit_price?: number;
  request_id?: string;
  status?: string;
  date?: string;
};

export type PatientLabChargesData = {
  patientId: string;
  patientName: string;
  facilityId: string | number;
  totalAmount: number;
  items: LabChargeItem[];
};

export type RadiologyChargeItem = {
  service: string;
  amount: number;
  study_name?: string;
  unit_price?: number;
  request_id?: string;
  status?: string;
  date?: string;
};

export type PatientRadiologyChargesData = {
  patientId: string;
  patientName: string;
  facilityId: string | number;
  totalAmount: number;
  items: RadiologyChargeItem[];
};

export type MpesaConfig = {
  id?: number;
  facilityId?: number;
  shortcode: string;
  passkey: string;
  consumer_key: string;
  consumer_secret: string;
  environment: 'sandbox' | 'production';
  transaction_type: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';

  account_reference_prefix: string;
  is_active: boolean;
};

export type MpesaSTKPushPayload = {
  invoiceId: string;
  phoneNumber: string;
  amount?: number;
};

export type MpesaTransaction = {
  id?: number;
  invoiceId: string;
  phone_number: string;
  amount: number;
  checkout_request_id: string;
  merchant_request_id: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Cancelled';
  result_code?: number | null;
  result_desc?: string | null;
  mpesa_receipt_number?: string | null;
  transaction_date?: string | null;
  created_at?: string;
};

export type MpesaSTKPushResponse = {
  checkoutRequestId: string;
  merchantRequestId: string;
  transaction: MpesaTransaction;
};



