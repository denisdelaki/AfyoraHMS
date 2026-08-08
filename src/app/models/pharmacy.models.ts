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

export type Prescription = {
  id: string;
  patientId: string;
  doctorId: string;
  drugs: {
    id: string;
    name: string;
    quantity: number;
    dosage: string;
  }[];
  status: 'Pending' | 'Dispensed';
  date: string;
};

export type CreateDrugRequest = Omit<Drug, 'id'>;
