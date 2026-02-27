export type Drug = {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  expiryDate: string;
  manufacturer: string;
};

export type PrescriptionDrug = {
  name: string;
  quantity: number;
  dosage: string;
};

export type Prescription = {
  id: string;
  patient: string;
  patientId: string;
  doctor: string;
  drugs: PrescriptionDrug[];
  status: 'Pending' | 'Dispensed';
  date: string;
};

export type CreateDrugRequest = Omit<Drug, 'id'>;
