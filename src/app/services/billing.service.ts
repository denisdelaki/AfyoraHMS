import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  Invoice,
  NewInvoicePayload,
  PaginatedResponse,
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

  getInvoices(): Observable<ApiResponse<PaginatedResponse<Invoice>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Invoice>>>(
      `${this.baseUrl}/invoices`,
    );
  }

  getPayments(): Observable<ApiResponse<PaginatedResponse<Payment>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Payment>>>(
      `${this.baseUrl}/payments`,
    );
  }

  createInvoice(payload: NewInvoicePayload): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(
      `${this.baseUrl}/invoices`,
      payload,
    );
  }

  recordPayment(
    invoiceId: string,
    payload: RecordPaymentPayload,
  ): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(
      `${this.baseUrl}/invoices/${encodeURIComponent(invoiceId)}/payments`,
      payload,
    );
  }

  sendInvoiceReminder(
    payload: SendInvoiceReminderRequest,
  ): Observable<SendInvoiceReminderResponse> {
    return this.http.post<SendInvoiceReminderResponse>(
      `${this.baseUrl}/invoices/reminders/sms`,
      payload,
    );
  }
}
