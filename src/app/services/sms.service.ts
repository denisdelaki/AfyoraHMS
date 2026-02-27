import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type SendInvoiceReminderRequest = {
  invoiceId: string;
  patientId: string;
  patientName: string;
  totalAmount: number;
  dueDate: string;
};

export type SendInvoiceReminderResponse = {
  success: boolean;
  message: string;
  providerMessageId?: string;
};

@Injectable({ providedIn: 'root' })
export class SmsService {
  private readonly http = inject(HttpClient);
  private readonly reminderEndpoint = '/api/sms/reminders/invoice';

  sendInvoiceReminder(
    payload: SendInvoiceReminderRequest,
  ): Observable<SendInvoiceReminderResponse> {
    return this.http.post<SendInvoiceReminderResponse>(
      this.reminderEndpoint,
      payload,
    );
  }
}
