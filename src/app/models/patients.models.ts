export type PatientStatus = 'Active' | 'Admitted' | 'Discharged';

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  lastVisit: string;
  status: PatientStatus;
  dob?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
};

export type RegisterPatientRequest = {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  dob?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
};

export type UpdatePatientRequest = Partial<RegisterPatientRequest>;

export type VisitHistory = {
  date: string;
  doctor: string;
  diagnosis: string;
  prescription: string;
};
