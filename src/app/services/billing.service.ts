import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  Invoice,
  NewInvoicePayload,
  PaginatedResponse,
  PatientPharmacyChargesData,
  PatientLabChargesData,
  PatientRadiologyChargesData,
  Payment,
  RecordPaymentPayload,
} from '../models';
import {
  SendInvoiceReminderRequest,
  SendInvoiceReminderResponse,
} from './sms.service';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/billing');

  getInvoices(facilityId: string | number): Observable<ApiResponse<PaginatedResponse<Invoice>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Invoice>>>(
      `${this.baseUrl}/invoices/?facilityId=${facilityId}/`,
    );
  }

  getPayments(facilityId: string | number): Observable<ApiResponse<PaginatedResponse<Payment>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Payment>>>(
      `${this.baseUrl}/payments/?facilityId=${facilityId}/`,
    );
  }

  getPatientPharmacyCharges(
    patientId: string | number,
    facilityId: string | number
  ): Observable<ApiResponse<PatientPharmacyChargesData>> {
    return this.http.get<ApiResponse<PatientPharmacyChargesData>>(
      `${this.baseUrl}/patient-pharmacy-charges/?patientId=${encodeURIComponent(patientId)}&facilityId=${facilityId}/`
    );
  }

  getPatientLabCharges(
    patientId: string | number,
    facilityId: string | number
  ): Observable<ApiResponse<PatientLabChargesData>> {
    return this.http.get<ApiResponse<PatientLabChargesData>>(
      `${this.baseUrl}/patient-lab-charges/?patientId=${encodeURIComponent(patientId)}&facilityId=${facilityId}/`
    );
  }

  getPatientRadiologyCharges(
    patientId: string | number,
    facilityId: string | number
  ): Observable<ApiResponse<PatientRadiologyChargesData>> {
    return this.http.get<ApiResponse<PatientRadiologyChargesData>>(
      `${this.baseUrl}/patient-radiology-charges/?patientId=${encodeURIComponent(patientId)}&facilityId=${facilityId}/`
    );
  }

  createInvoice(payload: NewInvoicePayload, facilityId: string | number): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(
      `${this.baseUrl}/invoices/?facilityId=${facilityId}/`,
      {
        ...payload,
        facilityId: facilityId
      }
    );
  }


  recordPayment(
    invoiceId: string,
    payload: RecordPaymentPayload,
    facilityId: string | number
  ): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(
      `${this.baseUrl}/invoices/${encodeURIComponent(invoiceId)}/payments/?facilityId=${facilityId}/`,
      payload,
    );
  }

  sendInvoiceReminder(
    payload: SendInvoiceReminderRequest,
    facilityId: string | number
  ): Observable<SendInvoiceReminderResponse> {
    return this.http.post<SendInvoiceReminderResponse>(
      `${this.baseUrl}/invoices/reminders/sms/?facilityId=${facilityId}/`,
      payload,
    );
  }
}

