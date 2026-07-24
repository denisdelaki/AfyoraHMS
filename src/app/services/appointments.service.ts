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

  getAppointments(
    facilityId: string | number,
  ): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(
      `${this.baseUrl}/?facilityId=${encodeURIComponent(facilityId)}/`,
    );
  }

  getAppointmentsByPatient(
    patientId: string,
    facilityId: string | number,
  ): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(
      `${this.baseUrl}?patientId=${encodeURIComponent(patientId)}&facilityId=${encodeURIComponent(facilityId)}/`,
    );
  }

  createAppointment(
    facilityId: string | number,
    payload: CreateAppointmentRequest,
  ): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(
      `${this.baseUrl}/?facilityId=${encodeURIComponent(facilityId)}/`,
      payload,
    );
  }

  updateAppointment(
    facilityId: string | number,
    appointmentId: string,
    payload: UpdateAppointmentRequest,
  ): Observable<ApiResponse<Appointment>> {
    return this.http.patch<ApiResponse<Appointment>>(
      `${this.baseUrl}/${encodeURIComponent(appointmentId)}/?facilityId=${encodeURIComponent(facilityId)}/`,
      payload,
    );
  }

  cancelAppointment(
    facilityId: string | number,
    appointmentId: string,
  ): Observable<ApiResponse<Appointment>> {
    return this.http.patch<ApiResponse<Appointment>>(
      `${this.baseUrl}/${encodeURIComponent(appointmentId)}/cancel/?facilityId=${encodeURIComponent(facilityId)}/`,
      {},
    );
  }
}
