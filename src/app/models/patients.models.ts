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
};
