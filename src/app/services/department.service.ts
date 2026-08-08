import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { Department } from '../models/employee.model';
import { ApiResponse, PaginatedResponse } from '../models';

type DepartmentCreatePayload = {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  location?: string;
  is_operational?: boolean;
  head?: string | number | null;
};

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/departments/');
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

  departments = signal<Department[]>([]);

  constructor() {}

  fetchDepartments(facilityId?: string | number): Observable<Department[]> {
    const params = this.buildFacilityParams(facilityId);

    return this.http
      .get<any>(this.baseUrl, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(
        map((response) => this.normalizeDepartmentList(response)),
        tap((departments) => this.departments.set(departments)),
      );
  }

  createDepartment(payload: DepartmentCreatePayload): Observable<Department> {
    return this.http
      .post<ApiResponse<Department> | Department>(this.baseUrl, payload, {
        headers: this.buildAuthHeaders(),
      })
      .pipe(
        map((response) => {
          if (
            response &&
            typeof response === 'object' &&
            ('data' in response || 'results' in response)
          ) {
            const apiResponse = response as ApiResponse<Department>;
            return apiResponse.results ?? apiResponse.data;
          }

          return response as Department;
        }),
        tap((created) => {
          this.departments.update((deps) => [...deps, created]);
        }),
      );
  }

  private normalizeDepartmentList(payload: unknown): Department[] {
    if (Array.isArray(payload)) {
      return payload as Department[];
    }

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const structured = payload as {
      results?: Department[];
      items?: Department[];
      data?: Department[];
    };

    if (Array.isArray(structured.results)) {
      return structured.results;
    }

    if (Array.isArray(structured.items)) {
      return structured.items;
    }

    if (Array.isArray(structured.data)) {
      return structured.data;
    }

    return [];
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
