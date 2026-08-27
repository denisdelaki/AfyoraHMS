import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { ApiResponse } from '../models';
import { PermissionsMap } from '../core/permissions.service';

export interface FacilityRole {
  id: number;
  name: string;
  description: string;
  permissions: PermissionsMap;
  is_system_role: boolean;
  user_count: number;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: Partial<PermissionsMap>;
}

export interface AssignRolePayload {
  user_id?: number;
  employee_id?: string;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/roles/');

  /** List all roles for the current facility */
  getRoles(): Observable<FacilityRole[]> {
    return this.http
      .get<ApiResponse<FacilityRole[]>>(this.baseUrl, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => {
          // Handle DRF paginated or plain array response
          const data = (res as any)?.results ?? (res as any)?.data ?? res;
          return Array.isArray(data) ? data : [];
        }),
      );
  }

  /** Get a single role */
  getRole(id: number): Observable<FacilityRole> {
    return this.http
      .get<ApiResponse<FacilityRole>>(`${this.baseUrl}${id}/`, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => (res as any)?.data ?? res as unknown as FacilityRole));
  }

  /** Create a new role (facility_admin only) */
  createRole(payload: CreateRolePayload): Observable<FacilityRole> {
    return this.http
      .post<ApiResponse<FacilityRole>>(this.baseUrl, payload, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => (res as any)?.data ?? res as unknown as FacilityRole));
  }

  /** Update an existing role */
  updateRole(id: number, payload: Partial<CreateRolePayload>): Observable<FacilityRole> {
    return this.http
      .put<ApiResponse<FacilityRole>>(`${this.baseUrl}${id}/`, payload, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => (res as any)?.data ?? res as unknown as FacilityRole));
  }

  /** Partially update an existing role (permissions only) */
  patchRole(id: number, payload: Partial<CreateRolePayload>): Observable<FacilityRole> {
    return this.http
      .patch<ApiResponse<FacilityRole>>(`${this.baseUrl}${id}/`, payload, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => (res as any)?.data ?? res as unknown as FacilityRole));
  }

  /** Delete a role */
  deleteRole(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}${id}/`, { headers: this.authHeaders() });
  }

  /** Get available permission module keys from the backend */
  getModules(): Observable<string[]> {
    return this.http
      .get<{ modules: string[] }>(`${this.baseUrl}modules/`, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => res.modules));
  }

  /** Assign a role to an employee */
  assignRole(roleId: number, payload: AssignRolePayload): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}${roleId}/assign/`, payload, {
        headers: this.authHeaders(),
      });
  }

  private authHeaders(): HttpHeaders {
    const token = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('afyora.accessToken') ?? '')
      : '';
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }
}
