import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiUrl } from '../core/api.config';
import {
  AllergyItem,
  ApiResponse,
  CpoeOrder,
  CreateEhrRecordRequest,
  EhrPatient,
  EhrRecord,
  ProblemItem,
  RadiologyImage,
} from '../models';

@Injectable({ providedIn: 'root' })
export class EhrService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('');

  getPatients(): Observable<ApiResponse<EhrPatient[]>> {
    return this.http.get<ApiResponse<EhrPatient[]>>(
      `${this.baseUrl}/patients/`,
    );
  }

  getPatientRecords(
    patientId: string,
    facilityId: string | number,
  ): Observable<ApiResponse<EhrRecord[]>> {
    return this.http.get<ApiResponse<EhrRecord[]>>(
      `${this.baseUrl}patients/${encodeURIComponent(patientId)}/ehr/?facilityId=${encodeURIComponent(facilityId)}/`,
    );
  }

  getPatientRadiology(
    patientId: string,
  ): Observable<ApiResponse<RadiologyImage[]>> {
    return this.http.get<ApiResponse<RadiologyImage[]>>(
      `${this.baseUrl}patients/${encodeURIComponent(patientId)}/radiology/`,
    );
  }

  createRecord(
    payload: CreateEhrRecordRequest,
  ): Observable<ApiResponse<EhrRecord>> {
    const normalizedPayload = {
      ...payload,
      diagnosisSystem: payload.diagnosisSystem || 'KNHTS',
      diagnosisText: payload.diagnosisText || payload.diagnosis,
    };

    return this.http.post<ApiResponse<EhrRecord>>(
      `${this.baseUrl}records/`,
      normalizedPayload,
    );
  }

  // Problem List (KNHTS / ICD-11 / SNOMED CT)
  getProblems(
    facilityId: string | number,
    patientId: string,
  ): Observable<ProblemItem[]> {
    return this.http
      .get<any>(
        `${this.baseUrl}patients/problems/?facilityId=${encodeURIComponent(facilityId)}&patientId=${encodeURIComponent(patientId)}`,
      )
      .pipe(
        map(
          (response) =>
            response?.results ||
            response?.data ||
            (Array.isArray(response) ? response : []),
        ),
      );
  }

  createProblem(
    facilityId: string | number,
    payload: Partial<ProblemItem>,
  ): Observable<ProblemItem> {
    return this.http.post<ProblemItem>(`${this.baseUrl}patients/problems/`, {
      ...payload,
      facilityId,
    });
  }

  // Allergy Registry (drives CDS drug-allergy cross-check)
  getAllergies(
    facilityId: string | number,
    patientId: string,
  ): Observable<AllergyItem[]> {
    return this.http
      .get<any>(
        `${this.baseUrl}patients/allergies/?facilityId=${encodeURIComponent(facilityId)}&patientId=${encodeURIComponent(patientId)}`,
      )
      .pipe(
        map(
          (response) =>
            response?.results ||
            response?.data ||
            (Array.isArray(response) ? response : []),
        ),
      );
  }

  createAllergy(
    facilityId: string | number,
    payload: Partial<AllergyItem>,
  ): Observable<AllergyItem> {
    return this.http.post<AllergyItem>(`${this.baseUrl}patients/allergies/`, {
      ...payload,
      facilityId,
    });
  }

  // Computerized Provider Order Entry (14 DHA order categories)
  getCpoeOrders(
    facilityId: string | number,
    patientId: string,
  ): Observable<CpoeOrder[]> {
    return this.http
      .get<any>(
        `${this.baseUrl}patients/cpoe-orders/?facilityId=${encodeURIComponent(facilityId)}&patientId=${encodeURIComponent(patientId)}`,
      )
      .pipe(
        map(
          (response) =>
            response?.results ||
            response?.data ||
            (Array.isArray(response) ? response : []),
        ),
      );
  }

  createCpoeOrder(
    facilityId: string | number,
    payload: Partial<CpoeOrder>,
  ): Observable<CpoeOrder> {
    return this.http.post<CpoeOrder>(`${this.baseUrl}patients/cpoe-orders/`, {
      ...payload,
      facilityId,
    });
  }
}
