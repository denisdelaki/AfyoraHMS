import { Prescription } from './pharmacy.models';

export type PatientStatus = 'Active' | 'Admitted' | 'Discharged';

export type Patient = {
  id: string;
  nationalId?: string;
  passportNumber?: string;
  birthCertificateNumber?: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  lastVisit: string;
  status: PatientStatus;
  dob?: string;
  address?: string;
  county?: string;
  subCounty?: string;
  ward?: string;
  village?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  knhtsGenderCode?: string;
};

export type RegisterPatientRequest = {
  facilityId: string | number;
  nationalId?: string;
  passportNumber?: string;
  birthCertificateNumber?: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  dob?: string;
  address?: string;
  county?: string;
  subCounty?: string;
  ward?: string;
  village?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  knhtsGenderCode?: string;
};

export type UpdatePatientRequest = Partial<RegisterPatientRequest>;

export type PatientVitals = {
  id?: number | string;
  facilityId?: number | string;
  patientId?: string;
  ticketId?: string | number;
  capturedBy?: {
    id: number | string;
    username: string;
    fullName: string;
    role: string;
  };
  capturedByName?: string;
  temperatureC?: number | string;
  systolicBp?: number;
  diastolicBp?: number;
  heartRateBpm?: number;
  respiratoryRate?: number;
  spo2Percent?: number;
  bloodGlucoseMmol?: number | string;
  heightCm?: number | string;
  weightKg?: number | string;
  bmi?: number | string;
  painScore?: number;
  notes?: string;
  recordedAt?: string;
};

export type VisitHistory = {
  id?: string;
  date: string;
  doctor: string;
  diagnosis: string;
  diagnosisCode?: string;
  diagnosisSystem?: string;
  diagnosisText?: string;
  prescriptions: Prescription[];
  amountBilled: number | string;
  whatHappened: string;
  vitals?: PatientVitals;
};
