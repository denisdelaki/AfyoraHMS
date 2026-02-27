import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/appointments');

  getAppointments(): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(this.baseUrl);
  }

  getAppointmentsByPatient(
    patientId: string,
  ): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(
      `${this.baseUrl}?patientId=${encodeURIComponent(patientId)}`,
    );
  }

  createAppointment(
    payload: CreateAppointmentRequest,
  ): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(this.baseUrl, payload);
  }

  updateAppointment(
    appointmentId: string,
    payload: UpdateAppointmentRequest,
  ): Observable<ApiResponse<Appointment>> {
    return this.http.patch<ApiResponse<Appointment>>(
      `${this.baseUrl}/${encodeURIComponent(appointmentId)}`,
      payload,
    );
  }

  cancelAppointment(
    appointmentId: string,
  ): Observable<ApiResponse<Appointment>> {
    return this.http.patch<ApiResponse<Appointment>>(
      `${this.baseUrl}/${encodeURIComponent(appointmentId)}/cancel`,
      {},
    );
  }
}
