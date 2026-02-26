export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  lastVisit: string;
  status: 'Active' | 'Admitted';
}

export interface Appointment {
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  doctor: string;
  department: string;
  status: string;
}

export interface VisitHistory {
  date: string;
  doctor: string;
  diagnosis: string;
  prescription: string;
}

export interface RegisterPatientPayload {
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
}

export interface CreateAppointmentPayload {
  patientId: string;
  date: Date;
  time: string;
  doctor: string;
  department: string;
}
