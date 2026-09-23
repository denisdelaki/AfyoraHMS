import { Prescription } from './pharmacy.models';

export type EhrPatient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  nationalId?: string;
  dob?: string;
};

export type LabResultStatus = 'Normal' | 'Abnormal' | 'High' | 'Critical';

export type EhrLabResult = {
  id: string;
  patientId: string;
  date: string;
  test: string;
  loincCode?: string;
  result: string;
  status: LabResultStatus;
  parameters: any[];
};

export type ProblemStatus = 'Active' | 'Resolved' | 'Chronic' | 'Inactive';

export type ProblemItem = {
  id: string;
  patientId: string;
  code: string;
  system: string;
  display: string;
  status: ProblemStatus;
  onsetDate: string;
  resolvedDate?: string;
  notes?: string;
  recordedBy?: string;
};

export type AllergySeverity = 'Mild' | 'Moderate' | 'Severe' | 'Anaphylactic';

export type AllergyItem = {
  id: string;
  patientId: string;
  allergenName: string;
  allergenCode?: string; // HPT Registry or RxNorm/KNHTS code
  allergyType: 'Medication' | 'Food' | 'Environmental' | 'Other';
  severity: AllergySeverity;
  reaction: string;
  onsetDate?: string;
};

export type CpoeOrderType =
  | 'Medications'
  | 'Dispensing'
  | 'Laboratory'
  | 'Radiology'
  | 'Physiotherapy'
  | 'Occupational Therapy'
  | 'Nutrition/Dietetics'
  | 'Social Work'
  | 'Counselling'
  | 'Family History'
  | 'Vital Signs'
  | 'BMI/Growth Charts'
  | 'Billing'
  | 'MCH Encounter';

export type CpoeOrder = {
  id: string;
  patientId: string;
  orderType: CpoeOrderType;
  title: string;
  code?: string;
  system?: string;
  instructions: string;
  orderedBy: string;
  orderDate: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  billingAmount?: number;
  categoryDetails?: any;
};

export type VitalSignsRecord = {
  id: string;
  patientId: string;
  date: string;
  temperatureC: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  pulseRateBpm: number;
  respiratoryRate: number;
  oxygenSaturationSpO2: number;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  recordedBy: string;
};

export type GrowthChartData = {
  patientId: string;
  ageMonths: number;
  heightCm: number;
  weightKg: number;
  headCircumferenceCm?: number;
  heightPercentile: number;
  weightPercentile: number;
  whoClassification: 'Normal' | 'Stunting Risk' | 'Underweight Risk' | 'Severe Malnutrition';
};

export type MchEncounterType = 'ANC' | 'PNC' | 'Immunization' | 'Child Wellness';

export type MchEncounterData = {
  id: string;
  patientId: string;
  encounterType: MchEncounterType;
  date: string;
  gestationalAgeWeeks?: number;
  fundalHeightCm?: number;
  fetalHeartRateBpm?: number;
  vaccineGiven?: string;
  doseNumber?: number;
  nextAppointmentDate?: string;
  clinicianNotes: string;
};

export type CdsAlertType = 'ALLERGY_ALERT' | 'HIGH_VITALS' | 'CRITICAL_LAB' | 'AGE_DOSAGE_WARNING';

export type CdsAlert = {
  id: string;
  type: CdsAlertType;
  severity: 'Info' | 'Warning' | 'Critical';
  title: string;
  message: string;
  recommendation: string;
  source: string;
};

export type EhrRecord = {
  id: string;
  patientId: string;
  date: string;
  doctor: string;
  diagnosis: string;
  diagnosisCode?: string;
  diagnosisSystem?: string;
  diagnosisText?: string;
  prescriptions: Prescription[];
  labResults: EhrLabResult[];
  cpoeOrders?: CpoeOrder[];
  problems?: ProblemItem[];
  allergies?: AllergyItem[];
  vitals?: VitalSignsRecord;
  cdsAlerts?: CdsAlert[];
  notes: string;
};

export type RadiologyImage = {
  id: string;
  patientId: string;
  date: string;
  type: string;
  radiologist: string;
  findings: string;
  status: string;
};

export type CreateEhrRecordRequest = {
  patientId: string;
  diagnosis: string;
  diagnosisCode?: string;
  diagnosisSystem?: string;
  diagnosisText?: string;
  symptoms: string;
  treatment: string;
  doctorNotes: string;
  cpoeOrders?: Partial<CpoeOrder>[];
  problems?: Partial<ProblemItem>[];
  allergies?: Partial<AllergyItem>[];
  vitals?: Partial<VitalSignsRecord>;
  mchEncounter?: Partial<MchEncounterData>;
};
