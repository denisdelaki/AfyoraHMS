import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  CreateDrugRequest,
  Drug,
  PaginatedResponse,
  Prescription,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/pharmacy');

  getDrugs(): Observable<ApiResponse<PaginatedResponse<Drug>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Drug>>>(
      `${this.baseUrl}/drugs`,
    );
  }

  createDrug(payload: CreateDrugRequest): Observable<ApiResponse<Drug>> {
    return this.http.post<ApiResponse<Drug>>(`${this.baseUrl}/drugs`, payload);
  }

  getPrescriptions(): Observable<ApiResponse<PaginatedResponse<Prescription>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Prescription>>>(
      `${this.baseUrl}/prescriptions`,
    );
  }

  dispensePrescription(
    prescriptionId: string,
  ): Observable<ApiResponse<Prescription>> {
    return this.http.patch<ApiResponse<Prescription>>(
      `${this.baseUrl}/prescriptions/${encodeURIComponent(prescriptionId)}/dispense`,
      {},
    );
  }
}
