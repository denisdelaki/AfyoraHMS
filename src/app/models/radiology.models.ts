export type ImagingPriority = 'Routine' | 'Urgent' | 'STAT';

export type RadiologyOrderStatus =
  | 'Pending'
  | 'Scheduled'
  | 'Completed'
  | 'Report Ready';

export interface ImagingType {
  id: string;
  name: string;
  duration: string;
  price: number;
}

export interface RadiologyOrder {
  id: string;
  patient: string;
  patientId: string;
  type: string;
  orderedBy: string;
  orderDate: string;
  scheduledDate: string;
  status: RadiologyOrderStatus;
  priority: ImagingPriority;
  clinicalNotes: string;
}

export interface RadiologyReport {
  orderId: string;
  patient: string;
  type: string;
  scanDate: string;
  radiologist: string;
  findings: string;
  impression: string;
  recommendations: string;
  status: 'Draft' | 'Finalized';
}

export interface UploadedRadiologyImage {
  id: string;
  orderId: string;
  name: string;
  url: string;
  source: 'uploaded' | 'camera' | 'seeded';
  uploadedAt: string;
}

export interface CreateImagingOrderPayload {
  patient: string;
  patientId: string;
  orderedBy: string;
  imagingTypeId: string;
  scheduledDate: string;
  priority: ImagingPriority;
  clinicalNotes: string;
}

export interface UploadRadiologyImagesPayload {
  orderId: string;
  files: File[];
}

export interface CreateRadiologyReportPayload {
  orderId: string;
  radiologist: string;
  findings: string;
  impression: string;
  recommendations: string;
}
