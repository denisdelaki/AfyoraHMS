export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  joinDate: string;
  salary: number;
  status: string;
  shift: string;
}

export interface Shift {
  shift: string;
  time: string;
  employees: string[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  facility?: string | number;
  email?: string;
  phone?: string;
  location?: string;
  is_operational?: boolean;
  head?: string | number | null;
  head_name?: string;
}

export interface EmployeeAttendance {
  id?: number;
  employee: string | number;
  employee_name?: string;
  employee_id_number?: string;
  department?: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
  status: string;
  hours_worked?: string | number;
  notes?: string;
}
