import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  FacilityModulesConfig,
  FacilityProfile,
  FacilityUpdateRequest,
  SubscribePayload,
  SubscribeResponse,
  SubscriptionPaymentRecord,
  UpdateFacilityModulesRequest,
  UpdateFacilityModulesResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class FacilityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/facilities');

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('afyora.accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  /** Get current facility profile */
  getMyFacility(): Observable<FacilityProfile> {
    return this.http
      .get<any>(`${this.baseUrl}/my-facility/`, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => (res?.data ?? res) as FacilityProfile),
      );
  }

  /** Get specific facility by ID */
  getFacility(id: number | string): Observable<FacilityProfile> {
    return this.http
      .get<any>(`${this.baseUrl}/${id}/`, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => (res?.data ?? res) as FacilityProfile),
      );
  }

  /** Update facility profile details */
  updateFacility(
    id: number | string,
    payload: Partial<FacilityUpdateRequest>,
  ): Observable<FacilityProfile> {
    return this.http
      .patch<any>(`${this.baseUrl}/${id}/`, payload, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => (res?.data ?? res) as FacilityProfile),
      );
  }

  /** Subscribe or upgrade package plan */
  subscribePackage(
    id: number | string,
    payload: SubscribePayload,
  ): Observable<SubscribeResponse> {
    return this.http.post<SubscribeResponse>(
      `${this.baseUrl}/${id}/subscribe/`,
      payload,
      {
        headers: this.authHeaders(),
      },
    );
  }

  /** Fetch payment/subscription transaction history */
  getSubscriptionHistory(
    id: number | string,
  ): Observable<SubscriptionPaymentRecord[]> {
    return this.http
      .get<any>(`${this.baseUrl}/${id}/subscription-history/`, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => {
          const list = res?.results ?? res?.data ?? res;
          return Array.isArray(list) ? list : [];
        }),
      );
  }

  /** Search registered health facilities from Kenya Master Health Facility Registry (KMHFR) API */
  searchKmhfrFacilities(query: string, page = 1, pageSize = 10): Observable<any> {
    return this.http.get<any>(apiUrl('/facilities/search/'), {
      params: {
        q: query,
        page: page.toString(),
        page_size: pageSize.toString(),
      },
    });
  }

  // -------------------------------------------------------
  // Module management
  // -------------------------------------------------------

  /** GET /api/facilities/{id}/manage-modules/ */
  getModules(facilityId: number | string): Observable<FacilityModulesConfig> {
    return this.http
      .get<any>(`${this.baseUrl}/${facilityId}/manage-modules/`, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => (res?.data ?? res) as FacilityModulesConfig));
  }

  /** PUT /api/facilities/{id}/manage-modules/ */
  updateModules(
    facilityId: number | string,
    payload: UpdateFacilityModulesRequest,
  ): Observable<UpdateFacilityModulesResponse> {
    return this.http
      .put<any>(`${this.baseUrl}/${facilityId}/manage-modules/`, payload, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => (res?.data ?? res) as UpdateFacilityModulesResponse));
  }
}
