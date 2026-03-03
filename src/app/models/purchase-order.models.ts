export interface PurchaseOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  items: PurchaseOrderItem[];
  total: number;
  status: 'Pending' | 'Delivered';
  orderDate: string;
  expectedDate: string;
}