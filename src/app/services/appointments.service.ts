import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from '../models';
import { DataSyncService } from './data-sync.service';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly dataSync = inject(DataSyncService);
  private readonly baseUrl = apiUrl('/appointments');

  getAppointments(facilityId: string | number): Observable<Appointment[]> {
    return this.dataSync.query(this.appointmentsKey(facilityId), () => this.http
      .get<
        ApiResponse<Appointment[]>
      >(`${this.baseUrl}/?facilityId=${encodeURIComponent(facilityId)}/`)
      .pipe(map((response) => response.results || [])));
  }

  getAppointmentsByPatient(
    patientId: string,
    facilityId: string | number,
  ): Observable<ApiResponse<Appointment[]>> {
    return this.dataSync.query(`appointments:patient:${facilityId}:${patientId}`, () => this.http.get<ApiResponse<Appointment[]>>(
      `${this.baseUrl}?patientId=${encodeURIComponent(patientId)}&facilityId=${encodeURIComponent(facilityId)}/`,
    ));
  }

  createAppointment(
    facilityId: string | number,
    payload: CreateAppointmentRequest,
  ): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(
      `${this.baseUrl}/?facilityId=${encodeURIComponent(facilityId)}/`,
      payload,
    ).pipe(tap(() => this.dataSync.invalidate(this.appointmentsKey(facilityId))));
  }

  updateAppointment(
    facilityId: string | number,
    appointmentId: string,
    payload: UpdateAppointmentRequest,
  ): Observable<ApiResponse<Appointment>> {
    const rollback = this.dataSync.optimisticUpdate<Appointment[]>(
      this.appointmentsKey(facilityId),
      (appointments) => appointments.map((appointment) => appointment.id === appointmentId ? { ...appointment, ...payload } : appointment),
    );
    return this.http.patch<ApiResponse<Appointment>>(
      `${this.baseUrl}/${encodeURIComponent(appointmentId)}/?facilityId=${encodeURIComponent(facilityId)}/`,
      payload,
    ).pipe(
      tap(() => this.dataSync.invalidate(`appointments:patient:${facilityId}:`)),
      catchError((error) => { rollback(); return throwError(() => error); }),
    );
  }

  cancelAppointment(
    facilityId: string | number,
    appointmentId: string,
  ): Observable<ApiResponse<Appointment>> {
    const rollback = this.dataSync.optimisticUpdate<Appointment[]>(
      this.appointmentsKey(facilityId),
      (appointments) => appointments.map((appointment) => appointment.id === appointmentId ? { ...appointment, status: 'Cancelled' } : appointment),
    );
    return this.http.patch<ApiResponse<Appointment>>(
      `${this.baseUrl}/${encodeURIComponent(appointmentId)}/cancel/?facilityId=${encodeURIComponent(facilityId)}/`,
      {},
    ).pipe(
      tap(() => this.dataSync.invalidate(`appointments:patient:${facilityId}:`)),
      catchError((error) => { rollback(); return throwError(() => error); }),
    );
  }

  private appointmentsKey(facilityId: string | number): string {
    return `appointments:${facilityId}`;
  }
}
