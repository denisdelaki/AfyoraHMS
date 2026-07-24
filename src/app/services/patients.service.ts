import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  Appointment,
  PaginatedResponse,
  Patient,
  RegisterPatientRequest,
  UpdatePatientRequest,
  VisitHistory,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/patients');

  getPatients(facilityId: string | number): Observable<Patient[]> {
    return this.http
      .get<
        ApiResponse<Patient[]>
      >(`${this.baseUrl}/?facilityId=${encodeURIComponent(facilityId)}`)
      .pipe(map((response) => response.results || []));
  }

  getPatientById(patientId: string): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}/`,
    );
  }

  registerPatient(
    payload: RegisterPatientRequest,
  ): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(`${this.baseUrl}/`, payload);
  }

  updatePatient(
    patientId: string,
    payload: UpdatePatientRequest,
    facilityId: string | number,
  ): Observable<ApiResponse<Patient>> {
    return this.http
      .patch<
        ApiResponse<Patient>
      >(`${this.baseUrl}/${encodeURIComponent(patientId)}/?facilityId=${encodeURIComponent(facilityId)}`, payload)
      .pipe(map((response) => response));
  }

  getPatientAppointments(
    patientId: string,
  ): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}/appointments/`,
    );
  }

  getPatientVisitHistory(
    patientId: string,
  ): Observable<ApiResponse<VisitHistory[]>> {
    return this.http.get<ApiResponse<VisitHistory[]>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}/visit-history/`,
    );
  }
}
