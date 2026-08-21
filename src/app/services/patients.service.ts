import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  Appointment,
  Patient,
  RegisterPatientRequest,
  UpdatePatientRequest,
  VisitHistory,
} from '../models';
import { DataSyncService } from './data-sync.service';

type VisitRecordPayload = {
  date: string;
  doctor: string;
  diagnosis: string;
  prescriptions: {
    drugs: { name: string; quantity: number; dosage: string }[];
    status: 'Pending' | 'Dispensed';
    date: string;
  }[];
  amountBilled: number | string;
  whatHappened: string;
};

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly http = inject(HttpClient);
  private readonly dataSync = inject(DataSyncService);
  private readonly baseUrl = apiUrl('/patients');

  getPatients(facilityId: string | number): Observable<Patient[]> {
    return this.dataSync.query(`patients:${facilityId}`, () => this.http
      .get<
        ApiResponse<Patient[]>
      >(`${this.baseUrl}/?facilityId=${encodeURIComponent(facilityId)}`)
      .pipe(map((response) => response.results || [])));
  }

  getPatientById(patientId: string): Observable<ApiResponse<Patient>> {
    return this.dataSync.query(`patients:detail:${patientId}`, () => this.http.get<ApiResponse<Patient>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}/`,
    ));
  }

  registerPatient(
    payload: RegisterPatientRequest,
  ): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(`${this.baseUrl}/`, payload).pipe(tap(() => this.dataSync.invalidate('patients:')));
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
      .pipe(map((response) => response), tap(() => this.dataSync.invalidate('patients:')));
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
    facilityId: string | number,
  ): Observable<VisitHistory[]> {
    return this.http
      .get<
        ApiResponse<VisitHistory[]>
      >(`${this.baseUrl}/${encodeURIComponent(patientId)}/visit-history/${this.buildFacilityQuery(facilityId)}/`)
      .pipe(map((response) => response.results || []));
  }

  createPatientVisitHistory(
    patientId: string,
    payload: VisitRecordPayload,
    facilityId?: string | number,
  ): Observable<ApiResponse<VisitHistory>> {
    const query = this.buildFacilityQuery(facilityId);
    return this.http.post<ApiResponse<VisitHistory>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}/visit-history/${query}/`,
      { ...payload, facilityId: facilityId },
    );
  }

  updatePatientVisitHistory(
    patientId: string,
    visitId: string,
    payload: Partial<VisitRecordPayload>,
    facilityId?: string | number,
  ): Observable<ApiResponse<VisitHistory>> {
    const query = this.buildFacilityQuery(facilityId);
    return this.http.patch<ApiResponse<VisitHistory>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}/visit-history/${encodeURIComponent(visitId)}/${query}/`,
      { ...payload, facilityId: facilityId },
    );
  }

  deletePatientVisitHistory(
    patientId: string,
    visitId: string,
    facilityId?: string | number,
  ): Observable<ApiResponse<null>> {
    const query = this.buildFacilityQuery(facilityId);
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/${encodeURIComponent(patientId)}/visit-history/${encodeURIComponent(visitId)}/${query}/`,
    );
  }

  private buildFacilityQuery(facilityId?: string | number): string {
    if (facilityId === null || facilityId === undefined || facilityId === '') {
      return '';
    }

    return `?facilityId=${encodeURIComponent(facilityId)}`;
  }
}
