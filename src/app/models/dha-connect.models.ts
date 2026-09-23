export interface InsuranceProvider {
  id?: number;
  facility_id?: string;
  name: string;
  code: string;
  payer_type: 'SOCIAL' | 'PRIVATE' | 'COMMUNITY';
  gateway_url: string;
  facility_code: string;
  api_token?: string;
  api_token_masked?: string;
  environment: 'UAT' | 'PROD';
  is_active: boolean;
  sandbox_mode: boolean;
  supported_schemes?: string[];
  last_ping_status?: string;
  last_ping_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SHAEligibilityResult {
  age?: number;
  dateOfBirth?: string;
  fullName?: string;
  gender?: string;
  memberCrNumber?: string;
  requestIdNumber?: string;
  requestIdType?: number;
  statusCode?: string;
  statusDesc?: string;
  whitelistedForOTP?: boolean;
  schemes?: SHAScheme[];
}

export interface SHAScheme {
  schemeCode: string;
  schemeName: string;
  benefitLimit: number;
  availableBalance: number;
  status: string;
}

export interface PatientBenefit {
  id: string;
  parent_benefit: string;
  parent_benefit_code: string;
  sub_benefit_code: string;
  sub_benefit_name: string;
  max_cap: number;
  is_active: boolean;
}

export interface BenefitIntervention {
  intervention_code: string;
  name: string;
  category: string;
  standard_fee: number;
  requires_preauth: boolean;
  sub_benefit_code: string;
}

export interface PayerUtilizationBalance {
  code: string;
  crId: string;
  limitScope: string;
  individualMaxLimit: number;
  individualUtilisedLimit: number;
  householdMaxLimit: number;
  householdUtilisedLimit: number;
  utilizationDays: number;
  nextAvailability: string;
  fundUtilizationLimit: {
    category: string;
    limit: number;
    utilised: number;
  }[];
  computationalDetail?: any;
}

export interface BedOccupancyData {
  name: string;
  bp_level: string;
  bed_occupancy_rate: {
    total_beds: number;
    occupied_beds: number;
    available_beds: number;
    icu_beds_total: number;
    icu_beds_available: number;
    occupancy_percentage: number;
  };
}

export interface DHAAuthorization {
  id?: number;
  guid: string;
  authCode?: string;
  token?: string;
  beneficiaryCode?: string;
  beneficiaryName?: string;
  beneficiaryNumber?: string;
  beneficiaryScheme?: string;
  benefitType?: string;
  status?: string;
  isOpen?: boolean;
  isComplete?: boolean;
  needsPreauth?: boolean;
  dateAuthorized?: string;
  expiry?: string;
  providerName?: string;
  providerFid?: string;
  sessionType?: string;
  notes?: string;
}

export interface DHAClaim {
  id?: string;
  claim_id?: number | string;
  authorization_code: string;
  authorization_guid?: string;
  patient_id: string;
  patient_name?: string;
  member_number?: string;
  service_type: 'CAPITATION' | 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY';
  workflow_state: 'OPEN' | 'PENDING_REVIEW' | 'SUBMITTED' | 'CLOSED' | 'RESUBMITTED';
  invoice_number?: string;
  total_claim_amount: number;
  total_claim_copay?: number;
  total_claim_net_amount: number;
  payer_code?: string;
  payer_name?: string;
  scheme_code?: string;
  scheme_name?: string;
  interventions?: any[];
  claim_diagnoses?: any[];
  invoices?: any[];
  visit_start?: string;
  discharged_on?: string;
  discharge_reason?: string;
}

export interface DHAPrescription {
  id?: number;
  guid?: string;
  code?: string;
  status?: string;
  doctorReviewStatus?: string;
  intervention_code: string;
  intervention?: any;
  beneficiary?: any;
  items: any[];
  dispenses?: any[];
}

export interface DHAEmergencyProtocol {
  protocol_code: string;
  protocol_name: string;
  intervention_code: string;
  standard_unit_price: number;
  description: string;
}

export interface DHALog {
  id: number;
  endpoint: string;
  method: string;
  status_code: number;
  request_payload: any;
  response_payload: any;
  error_message?: string;
  is_mocked: boolean;
  timestamp: string;
}
