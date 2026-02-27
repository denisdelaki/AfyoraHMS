export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  doctor: string;
  department: string;
  status: AppointmentStatus;
};

export type CreateAppointmentRequest = {
  patientId: string;
  date: string;
  time: string;
  doctor: string;
  department: string;
};

export type UpdateAppointmentRequest = Partial<
  Pick<Appointment, 'date' | 'time' | 'doctor' | 'department' | 'status'>
>;
