export type LabRequestStatus =
  | 'Pending'
  | 'In Progress'
  | 'Completed'
  | 'Approved';

export type LabPriority = 'Routine' | 'Urgent' | 'STAT';

export interface LabTest {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
}

export interface LabRequest {
  id: string;
  patient: string;
  patientId: string;
  test: string;
  orderedBy: string;
  orderDate: string;
  sampleCollected: string;
  status: LabRequestStatus;
  priority: LabPriority;
}

export interface LabResultParameter {
  name: string;
  value: string;
  unit: string;
  range: string;
  status: 'Normal' | 'Abnormal';
}

export interface LabResult {
  labId: string;
  patient: string;
  test: string;
  parameters: LabResultParameter[];
  technician: string;
  completedDate: string;
  approvedBy: string | null;
  status: 'Awaiting Approval' | 'Approved';
  remarks?: string;
}

export interface CreateLabOrderPayload {
  patient: string;
  patientId: string;
  orderedBy: string;
  testId: string;
  priority: LabPriority;
  notes?: string;
}

export interface SubmitLabResultPayload {
  labId: string;
  parameters: LabResultParameter[];
  remarks?: string;
}
