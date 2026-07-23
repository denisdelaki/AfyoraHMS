import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { Employee, Shift, Attendance } from '../models/employee.model';
import { ApiResponse, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/employees/');
  private readonly facilityStorageKeys = [
    'afyora.facilityId',
    'afyora.organizationId',
  ];
  private readonly tokenStorageKeys = [
    'afyora.accessToken',
    'accessToken',
    'access_token',
    'token',
  ];

  private initialEmployees: Employee[] = [
    //     {
    //       id: 'EMP001',
    //       name: 'Dr. Emily Chen',
    //       role: 'Cardiologist',
    //       department: 'Cardiology',
    //       email: 'e.chen@hospital.com',
    //       phone: '+1 555-1001',
    //       joinDate: '2020-03-15',
    //       salary: 180000,
    //       status: 'Active',
    //       shift: 'Morning',
    //     },
    //     {
    //       id: 'EMP002',
    //       name: 'Dr. James Wilson',
    //       role: 'Surgeon',
    //       department: 'Surgery',
    //       email: 'j.wilson@hospital.com',
    //       phone: '+1 555-1002',
    //       joinDate: '2019-06-20',
    //       salary: 220000,
    //       status: 'Active',
    //       shift: 'Morning',
    //     },
    //     {
    //       id: 'EMP003',
    //       name: 'Nurse Lisa Anderson',
    //       role: 'ICU Nurse',
    //       department: 'ICU',
    //       email: 'l.anderson@hospital.com',
    //       phone: '+1 555-1003',
    //       joinDate: '2021-01-10',
    //       salary: 75000,
    //       status: 'Active',
    //       shift: 'Night',
    //     },
    //     {
    //       id: 'EMP004',
    //       name: 'Dr. Robert Taylor',
    //       role: 'Pediatrician',
    //       department: 'Pediatrics',
    //       email: 'r.taylor@hospital.com',
    //       phone: '+1 555-1004',
    //       joinDate: '2018-09-05',
    //       salary: 165000,
    //       status: 'Active',
    //       shift: 'Morning',
    //     },
    //     {
    //       id: 'EMP005',
    //       name: 'Tech Sarah Park',
    //       role: 'Lab Technician',
    //       department: 'Laboratory',
    //       email: 's.park@hospital.com',
    //       phone: '+1 555-1005',
    //       joinDate: '2022-04-12',
    //       salary: 55000,
    //       status: 'Active',
    //       shift: 'Evening',
    //     },
  ];

  private initialShifts: Shift[] = [
    {
      shift: 'Morning',
      time: '06:00 AM - 02:00 PM',
      employees: ['Dr. Emily Chen', 'Dr. James Wilson', 'Dr. Robert Taylor'],
    },
    {
      shift: 'Evening',
      time: '02:00 PM - 10:00 PM',
      employees: ['Tech Sarah Park', 'Nurse John Davis'],
    },
    {
      shift: 'Night',
      time: '10:00 PM - 06:00 AM',
      employees: ['Nurse Lisa Anderson', 'Dr. Michael Brown'],
    },
  ];

  private initialAttendance: Attendance[] = [
    {
      date: '2024-02-24',
      employee: 'Dr. Emily Chen',
      checkIn: '06:15 AM',
      checkOut: '02:05 PM',
      status: 'Present',
    },
    {
      date: '2024-02-24',
      employee: 'Dr. James Wilson',
      checkIn: '06:00 AM',
      checkOut: 'In Progress',
      status: 'Present',
    },
    {
      date: '2024-02-24',
      employee: 'Nurse Lisa Anderson',
      checkIn: '-',
      checkOut: '-',
      status: 'Scheduled (Night)',
    },
  ];

  employees = signal<Employee[]>(this.initialEmployees);
  shifts = signal<Shift[]>(this.initialShifts);
  attendance = signal<Attendance[]>(this.initialAttendance);

  constructor() {}

  fetchEmployees(facilityId: string | number): Observable<Employee[]> {
    const params = this.buildFacilityParams(facilityId);

    return this.http
      .get<ApiResponse<Employee[]>>(this.baseUrl, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(
        map((response) => this.normalizeEmployeeList(response.results || [])),
        tap((employees) => this.employees.set(employees)),
      );
  }

  getEmployeeById(employeeId: string): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(
      `${this.baseUrl}${encodeURIComponent(employeeId)}/`,
      {
        headers: this.buildAuthHeaders(),
      },
    );
  }

  createEmployee(payload: Omit<Employee, 'id'>): Observable<Employee> {
    return this.http
      .post<ApiResponse<Employee>>(this.baseUrl, payload, {
        headers: this.buildAuthHeaders(),
      })
      .pipe(
        map((response) => response.data),
        tap((createdEmployee) => {
          this.employees.update((emps) => [...emps, createdEmployee]);
        }),
      );
  }

  putEmployee(
    employeeId: string,
    payload: Omit<Employee, 'id'>,
  ): Observable<Employee> {
    return this.http
      .put<ApiResponse<Employee>>(
        `${this.baseUrl}${encodeURIComponent(employeeId)}/`,
        payload,
        {
          headers: this.buildAuthHeaders(),
        },
      )
      .pipe(
        map((response) => response.data),
        tap((updatedEmployee) => {
          this.replaceEmployeeInState(updatedEmployee);
        }),
      );
  }

  updateEmployee(
    employeeId: string,
    payload: Partial<Omit<Employee, 'id'>>,
  ): Observable<Employee> {
    return this.http
      .patch<ApiResponse<Employee>>(
        `${this.baseUrl}${encodeURIComponent(employeeId)}/`,
        payload,
        {
          headers: this.buildAuthHeaders(),
        },
      )
      .pipe(
        map((response) => response.data),
        tap((updatedEmployee) => {
          this.replaceEmployeeInState(updatedEmployee);
        }),
      );
  }

  deleteEmployee(employeeId: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(
        `${this.baseUrl}${encodeURIComponent(employeeId)}/`,
        {
          headers: this.buildAuthHeaders(),
        },
      )
      .pipe(
        tap(() => {
          this.employees.update((emps) =>
            emps.filter((employee) => employee.id !== employeeId),
          );
        }),
      );
  }

  addEmployee(employee: Omit<Employee, 'id'>): Observable<Employee> {
    return this.createEmployee(employee);
  }

  private normalizeEmployeeList(
    payload: Employee[] | PaginatedResponse<Employee>,
  ): Employee[] {
    return Array.isArray(payload) ? payload : payload.items;
  }

  private replaceEmployeeInState(updatedEmployee: Employee): void {
    this.employees.update((employees) =>
      employees.map((employee) =>
        employee.id === updatedEmployee.id ? updatedEmployee : employee,
      ),
    );
  }

  private buildFacilityParams(facilityId?: string | number): HttpParams {
    const facility = facilityId ?? this.getFacilityFromStorage();

    if (
      facility === null ||
      facility === undefined ||
      `${facility}`.trim() === ''
    ) {
      return new HttpParams();
    }

    return new HttpParams().set('facility', String(facility));
  }

  private getFacilityFromStorage(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    for (const key of this.facilityStorageKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.getAccessTokenFromStorage();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private getAccessTokenFromStorage(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    for (const key of this.tokenStorageKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  }
}
