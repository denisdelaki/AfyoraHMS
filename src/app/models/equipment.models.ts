export interface Equipment {
  id: string;
  name: string;
  category: string;
  status: 'Operational' | 'Under Maintenance';
  lastMaintenance: string;
  nextMaintenance: string;
  location: string;
  purchaseDate: string;
}