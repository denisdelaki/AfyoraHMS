export type QueueDestination =
  | 'Reception'
  | 'Consultation'
  | 'Laboratory'
  | 'Radiology'
  | 'Pharmacy'
  | 'Billing';

export type TicketPriority = 'Normal' | 'Urgent';
export type TicketStatus = 'Queued' | 'Called' | 'In service' | 'Completed';

export type TicketMovement = {
  from: QueueDestination | null;
  to: QueueDestination;
  at: string;
  by: string;
  note?: string;
};

export type VisitTicket = {
  id: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  destination: QueueDestination;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  movements: TicketMovement[];
};

export const QUEUE_DESTINATIONS: QueueDestination[] = [
  'Reception',
  'Consultation',
  'Laboratory',
  'Radiology',
  'Pharmacy',
  'Billing',
];
