export type DashboardStat = {
  name: string;
  value: string;
  change: string;
  color: string;
};

export type RevenuePoint = {
  month: string;
  revenue: number;
};

export type PatientGrowthPoint = {
  month: string;
  patients: number;
};

export type PendingLab = {
  id: string;
  patient: string;
  test: string;
  time: string;
};

export type StaffDuty = {
  name: string;
  role: string;
  status: string;
  shift: string;
};

export type TodayAppointment = {
  time: string;
  patient: string;
  doctor: string;
  department: string;
};

export type DashboardOverview = {
  stats: DashboardStat[];
  revenueData: RevenuePoint[];
  patientData: PatientGrowthPoint[];
  pendingLabs: PendingLab[];
  staffOnDuty: StaffDuty[];
  upcomingAppointments: TodayAppointment[];
};
