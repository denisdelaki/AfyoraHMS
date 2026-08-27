export interface FacilityProfile {
  id: number | string;
  name: string;
  facility_type: 'hospital' | 'clinic' | string;
  registration_number: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string | null;
  description?: string;
  website?: string;
  subscription_active: boolean;
  subscription_package: 'basic' | 'professional' | 'enterprise' | string;
  subscription_billing_cycle: 'monthly' | 'yearly' | string;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  onboarding_completed?: boolean;
  total_patients?: number;
  total_staff?: number;
  departments_count?: number;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FacilityUpdateRequest {
  name: string;
  facility_type: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  description?: string;
  website?: string;
}

export interface SubscriptionPaymentRecord {
  id: number | string;
  facility: number | string;
  facility_name?: string;
  package: string;
  billing_cycle: string;
  amount: number | string;
  payment_method: 'mpesa' | 'card' | 'bank_transfer' | string;
  phone_number?: string;
  transaction_reference: string;
  status: 'completed' | 'pending' | 'failed' | string;
  notes?: string;
  created_at: string;
}

export interface SubscribePayload {
  package: 'basic' | 'standard' | 'premium' | 'enterprise' | string;
  billing_cycle: 'monthly' | 'yearly' | string;
  payment_method: 'mpesa' | 'card' | 'bank_transfer' | string;
  phone_number?: string;
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
}

export interface SubscribeResponse {
  message: string;
  facility: FacilityProfile;
  payment: SubscriptionPaymentRecord;
}
