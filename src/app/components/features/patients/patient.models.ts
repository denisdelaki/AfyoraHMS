import {
  Patient as PatientModel,
  RegisterPatientRequest,
  VisitHistory as VisitHistoryModel,
} from '../../../models';

export type Patient = PatientModel;
export type Appointment = {
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  doctor: string;
  department: string;
  status: string;
};
export type VisitHistory = VisitHistoryModel;
export type RegisterPatientPayload = RegisterPatientRequest;

export interface CreateAppointmentPayload {
  patientId: string;
  date: Date;
  time: string;
  doctor: string;
  department: string;
}
