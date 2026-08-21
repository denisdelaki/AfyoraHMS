export type InventoryItemType = 'Supply' | 'Equipment';

export interface AddInventoryItemPayload {
  type: InventoryItemType;
  name: string;
  category: string;
  stock?: number;
  minStock?: number;
  unit?: string;
  price?: number;
  vendor?: string;
  status?: string;
  location?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  purchaseDate?: string;
}
