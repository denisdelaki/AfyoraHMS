import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  CreateEhrRecordRequest,
  EhrPatient,
  EhrRecord,
  RadiologyImage,
} from '../models';

@Injectable({ providedIn: 'root' })
export class EhrService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/ehr');

  getPatients(): Observable<ApiResponse<EhrPatient[]>> {
    return this.http.get<ApiResponse<EhrPatient[]>>(`${this.baseUrl}/patients`);
  }

  getPatientRecords(patientId: string): Observable<ApiResponse<EhrRecord[]>> {
    return this.http.get<ApiResponse<EhrRecord[]>>(
      `${this.baseUrl}/patients/${encodeURIComponent(patientId)}/records`,
    );
  }

  getPatientRadiology(
    patientId: string,
  ): Observable<ApiResponse<RadiologyImage[]>> {
    return this.http.get<ApiResponse<RadiologyImage[]>>(
      `${this.baseUrl}/patients/${encodeURIComponent(patientId)}/radiology`,
    );
  }

  createRecord(
    payload: CreateEhrRecordRequest,
  ): Observable<ApiResponse<EhrRecord>> {
    return this.http.post<ApiResponse<EhrRecord>>(
      `${this.baseUrl}/records`,
      payload,
    );
  }
}
