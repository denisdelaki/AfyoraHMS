export type EhrPatient = {
  id: string;
  name: string;
  age: number;
  gender: string;
};

export type LabResultStatus = 'Normal' | 'Abnormal' | 'High';

export type EhrLabResult = {
  test: string;
  result: string;
  status: LabResultStatus;
};

export type EhrRecord = {
  id: string;
  patientId: string;
  date: string;
  doctor: string;
  diagnosis: string;
  prescriptions: string[];
  labResults: EhrLabResult[];
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
  symptoms: string;
  treatment: string;
  doctorNotes: string;
};
