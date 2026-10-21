import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { Employee, Shift, EmployeeAttendance } from '../models/employee.model';
import { ApiResponse, PaginatedResponse } from '../models';
import { PageResult, normalizePageResult } from '../core/pagination';

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

  private initialEmployees: Employee[] = [];
  private initialShifts: Shift[] = [];

  employees = signal<Employee[]>(this.initialEmployees);
  shifts = signal<Shift[]>(this.initialShifts);
  attendance = signal<EmployeeAttendance[]>([]);
  myAttendance = signal<EmployeeAttendance[]>([]);

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

  fetchEmployeesPage(
    facilityId: string | number,
    page: number,
    pageSize: number,
    search = '',
  ): Observable<PageResult<Employee>> {
    let params = this.buildFacilityParams(facilityId)
      .set('page', String(page))
      .set('page_size', String(pageSize));
    if (search.trim()) params = params.set('search', search.trim());

    return this.http
      .get<unknown>(this.baseUrl, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(
        map((response) =>
          normalizePageResult<Employee>(response, { page, pageSize }),
        ),
        tap((pageResult) => this.employees.set(pageResult.items)),
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
  ): Observable<Employee | undefined> {
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
          this.replaceEmployeeInState(updatedEmployee, employeeId);
        }),
      );
  }

  updateEmployee(
    employeeId: string,
    payload: Partial<Omit<Employee, 'id'>>,
  ): Observable<Employee | undefined> {
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
          this.replaceEmployeeInState(updatedEmployee, employeeId);
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

  clockIn(): Observable<EmployeeAttendance> {
    return this.http
      .post<EmployeeAttendance>(`${this.baseUrl}clock-in/`, {}, {
        headers: this.buildAuthHeaders(),
      })
      .pipe(
        tap((record) => {
          this.myAttendance.update((logs) => [record, ...logs]);
        }),
      );
  }

  clockOut(): Observable<EmployeeAttendance> {
    return this.http
      .post<EmployeeAttendance>(`${this.baseUrl}clock-out/`, {}, {
        headers: this.buildAuthHeaders(),
      })
      .pipe(
        tap((record) => {
          this.myAttendance.update((logs) =>
            logs.map((log) => (log.id === record.id ? record : log)),
          );
        }),
      );
  }

  getMyAttendance(): Observable<EmployeeAttendance[]> {
    return this.http
      .get<any>(`${this.baseUrl}my-attendance/`, {
        headers: this.buildAuthHeaders(),
      })
      .pipe(
        map((response) => response.results || response.data || response),
        tap((logs) => this.myAttendance.set(logs)),
      );
  }

  getFacilityAttendance(): Observable<EmployeeAttendance[]> {
    return this.http
      .get<any>(`${this.baseUrl}attendance/`, {
        headers: this.buildAuthHeaders(),
      })
      .pipe(
        map((response) => response.results || response.data || response),
        tap((logs) => this.attendance.set(logs)),
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

  private replaceEmployeeInState(
    updatedEmployee: Employee | null | undefined,
    employeeId: string,
  ): void {
    if (!updatedEmployee || typeof updatedEmployee !== 'object') return;

    const employeeWithId = {
      ...updatedEmployee,
      id: updatedEmployee.id || employeeId,
    };
    this.employees.update((employees) =>
      employees.map((employee) =>
        employee.id === employeeId
          ? { ...employee, ...employeeWithId }
          : employee,
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
