export type UserRole =
  | 'Admin'
  | 'SuperAdmin'
  | 'Doctor'
  | 'Nurse'
  | 'Pharmacist'
  | 'Lab Technician'
  | 'Radiologist'
  | 'Accountant'
  | 'HR'
  | 'Receptionist'
  | 'Manager'
  | string;

export type ReportType =
  | 'general'
  | 'patients'
  | 'pharmacy'
  | 'inventory'
  | 'laboratory'
  | 'employees'
  | 'revenue'
  | 'surveillance'
  | 'interoperability';

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
  | 'trendingUp'
  | 'shieldCheck'
  | 'network';
  allowedRoles?: string[];
  description?: string;
}

export interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

export interface ReportFilterParams {
  selectedReport: ReportType;
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  department?: string;
  facilityId?: string | number;
}

export interface SavedReport {
  id: string;
  title: string;
  description: string;
  reportType: ReportType;
  timeRange: TimeRange;
  department?: string;
  chartType: 'line' | 'bar';
  allowedRoles: string[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CustomReportPayload {
  title: string;
  description: string;
  reportType: ReportType;
  timeRange: TimeRange;
  department?: string;
  chartType: 'line' | 'bar';
  allowedRoles: string[];
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

export interface SurveillanceComplianceMetric {
  id: string;
  category: string;
  name: string;
  status: 'Compliant' | 'Partial' | 'Not Ready';
  scorePercentage: number;
  weight: number;
  notes: string;
}

export interface SurveillanceComplianceSummary {
  overallScore: number;
  status: 'Compliant' | 'Not Ready' | 'Action Required';
  metrics: SurveillanceComplianceMetric[];
  lastAudited: string;
}

export interface NotifiableDiseaseAlert {
  id: string;
  diseaseName: string;
  icdCode: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  subCounty: string;
  detectedAt: string;
  status: 'TRIGGERED' | 'REPORTED' | 'INVESTIGATING' | 'RESOLVED';
  mohNotified: boolean;
  mohNotificationTimestamp?: string;
  actionTaken?: string;
}

export interface IdsrWeeklyDiseaseRow {
  diseaseCode: string;
  diseaseName: string;
  casesUnder5: number;
  deathsUnder5: number;
  casesOver5: number;
  deathsOver5: number;
  totalCases: number;
  totalDeaths: number;
  labConfirmed: number;
}

export interface IdsrWeeklyReport {
  epiWeek: number;
  year: number;
  startDate: string;
  endDate: string;
  facilityMflCode: string;
  facilityName: string;
  subCounty: string;
  county: string;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED';
  submissionDate?: string;
  submittedBy?: string;
  diseases: IdsrWeeklyDiseaseRow[];
  totalCasesSummary: number;
  totalDeathsSummary: number;
}

export interface PublicHealthEvent {
  id: string;
  eventName: string;
  eventType: 'OUTBREAK_CLUSTER' | 'ENVIRONMENTAL' | 'UNUSUALLY_HIGH_CASES' | 'UNKNOWN_ETIOLOGY';
  location: string;
  casesCount: number;
  thresholdBreached: string;
  detectedDate: string;
  alertLevel: 'GREEN' | 'AMBER' | 'RED';
  responseStatus: 'ACTIVE' | 'CONTAINED' | 'UNDER_MONITORING';
  alertSentToCounties: boolean;
}

export interface IhrAssessment {
  id: string;
  assessmentDate: string;
  evaluatedBy: string;
  isPublicHealthImpactSerious: boolean;
  isEventUnusualOrUnexpected: boolean;
  isSignificantRiskOfInternationalSpread: boolean;
  isSignificantRiskOfTravelOrTradeRestrictions: boolean;
  decisionInstrumentScore: number; // 0 to 4
  requiresIhrNotification: boolean; // true if score >= 2
  notes: string;
}

export interface RoutineMohReportRow {
  indicatorCode: string;
  indicatorName: string;
  countUnder5Male: number;
  countUnder5Female: number;
  countOver5Male: number;
  countOver5Female: number;
  total: number;
}

export interface RoutineMohReport {
  reportForm: 'MOH_705A' | 'MOH_705B' | 'MOH_711' | 'MOH_717';
  title: string;
  month: string;
  year: number;
  facilityName: string;
  totalWorkloadCount: number;
  rows: RoutineMohReportRow[];
  generatedAt: string;
}

export interface ReportDataBundle {
  patientData: PatientDataPoint[];
  pharmacyData: PharmacyDataPoint[];
  inventoryData: InventoryDataPoint[];
  laboratoryData: LaboratoryDataPoint[];
  employeeData: EmployeeDataPoint[];
  revenueData: RevenueDataPoint[];
  topMedications?: TopMedication[];
  employeePerformance?: EmployeePerformance[];
  summaryStats?: SummaryStatistic[];
  surveillanceSummary?: SurveillanceComplianceSummary;
  activeDiseaseAlerts?: NotifiableDiseaseAlert[];
}


