export interface PurchaseOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  vendor: string | number;
  vendorName?: string;
  items: PurchaseOrderItem[];
  total: number;
  status: 'Pending' | 'Delivered' | 'Approved' | 'Shipped' | 'Cancelled';
  orderDate: string;
  expectedDate: string;
}