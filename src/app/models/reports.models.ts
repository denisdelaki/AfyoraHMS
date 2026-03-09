export type ReportType =
  | 'general'
  | 'patients'
  | 'pharmacy'
  | 'inventory'
  | 'laboratory'
  | 'employees'
  | 'revenue';

export type TimeRange =
  | '7days'
  | '30days'
  | '3months'
  | '6months'
  | '1year'
  | 'custom';

export interface ReportTypeOption {
  value: ReportType;
  label: string;
  iconKey:
    | 'barChart'
    | 'users'
    | 'pill'
    | 'package'
    | 'flask'
    | 'userCog'
    | 'trendingUp';
}

export interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

export interface MetricCard {
  title: string;
  value: string;
  change?: string;
  iconKey: 'users' | 'trendingUp' | 'pill' | 'package' | 'flask' | 'userCog';
  accentClass: string;
}

export interface PatientDataPoint {
  date: string;
  newPatients: number;
  returning: number;
  total: number;
}

export interface PharmacyDataPoint {
  date: string;
  prescriptions: number;
  revenue: number;
  refills: number;
}

export interface InventoryDataPoint {
  category: string;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  value: number;
}

export interface LaboratoryDataPoint {
  date: string;
  bloodTests: number;
  xrays: number;
  mris: number;
  ctScans: number;
}

export interface EmployeeDataPoint {
  date: string;
  attendance: number;
  overtime: number;
  leaves: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface TopMedication {
  name: string;
  dispensed: number;
  revenue: number;
}

export interface EmployeePerformance {
  department: string;
  headcount: number;
  avgSalary: number;
  turnover: number;
}

export interface SummaryStatistic {
  category: string;
  currentValue: string;
  previousPeriod: string;
  change: string;
  status: 'Excellent' | 'Good' | 'Stable' | 'Monitor';
}

export interface ReportDataBundle {
  patientData: PatientDataPoint[];
  pharmacyData: PharmacyDataPoint[];
  inventoryData: InventoryDataPoint[];
  laboratoryData: LaboratoryDataPoint[];
  employeeData: EmployeeDataPoint[];
  revenueData: RevenueDataPoint[];
}
