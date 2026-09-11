export type DrugCategory = {
  id: number;
  facilityId: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Drug = {
  id: string;
  name: string;
  categoryId?: number;
  categoryName?: string;
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

export type CreateDrugRequest = Omit<Drug, 'id' | 'categoryName'>;

export type DrugPurchaseOrderItem = {
  id?: number;
  drugName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
};

export type DrugPurchaseOrder = {
  id: number;
  facilityId: number;
  poNumber: string;
  vendorId?: number;
  vendorName?: string;
  vendorEmail?: string;
  items: DrugPurchaseOrderItem[];
  status: 'Draft' | 'Pending' | 'Approved' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  notes?: string;
  orderDate: string;
  expectedDate?: string;
  emailSent: boolean;
};

export type CreateDrugPurchaseOrderRequest = {
  vendorId?: number;
  items: Omit<DrugPurchaseOrderItem, 'id' | 'totalPrice'>[];
  status?: string;
  notes?: string;
  expectedDate?: string;
};
