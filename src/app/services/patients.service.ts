import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

  getPatients(): Observable<ApiResponse<PaginatedResponse<Patient>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Patient>>>(this.baseUrl);
  }

  getPatientById(patientId: string): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}`,
    );
  }

  registerPatient(
    payload: RegisterPatientRequest,
  ): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(this.baseUrl, payload);
  }

  updatePatient(
    patientId: string,
    payload: UpdatePatientRequest,
  ): Observable<ApiResponse<Patient>> {
    return this.http.patch<ApiResponse<Patient>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}`,
      payload,
    );
  }

  getPatientAppointments(
    patientId: string,
  ): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}/appointments`,
    );
  }

  getPatientVisitHistory(
    patientId: string,
  ): Observable<ApiResponse<VisitHistory[]>> {
    return this.http.get<ApiResponse<VisitHistory[]>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}/visit-history`,
    );
  }
}
