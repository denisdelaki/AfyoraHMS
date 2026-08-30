import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecordPaymentPayload } from '../../../models/billing.models';
import { BillingService } from '../../../services/billing.service';

export type RecordPaymentDialogData = {
  invoiceId: string;
  amount: number;
  facilityId?: string | number;
  phoneNumber?: string;
};

@Component({
  selector: 'app-record-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './record-payment-dialog.component.html',
  styleUrl: './record-payment-dialog.component.css',
})
export class RecordPaymentDialogComponent implements OnDestroy {
  readonly data = inject<RecordPaymentDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);
  private readonly billingService = inject(BillingService);
  private readonly dialogRef = inject(
    MatDialogRef<
      RecordPaymentDialogComponent,
      RecordPaymentPayload | undefined
    >,
  );

  readonly paymentMethods = [
    'Cash',
    'Mobile Payment',
    'Credit Card',
    'Debit Card',
    'Insurance',
  ];

  readonly paymentForm = this.formBuilder.group({
    amount: [this.data.amount, [Validators.required, Validators.min(0)]],
    method: ['Mobile Payment', [Validators.required]],
    phoneNumber: [this.data.phoneNumber || '', []],
  });

  // STK Push State Signals
  stkSending = signal<boolean>(false);
  stkPolling = signal<boolean>(false);
  stkSuccess = signal<boolean>(false);
  stkError = signal<string | null>(null);
  stkMessage = signal<string | null>(null);
  checkoutRequestId = signal<string | null>(null);

  private pollTimer: any = null;

  ngOnDestroy(): void {
    this.stopPolling();
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  onCancel(): void {
    this.stopPolling();
    this.dialogRef.close();
  }

  triggerStkPush(): void {
    const rawVal = this.paymentForm.getRawValue();
    const phone = rawVal.phoneNumber ? String(rawVal.phoneNumber).trim() : '';

    if (!phone) {
      this.stkError.set('Please enter the patient M-Pesa phone number.');
      return;
    }

    const facilityId = this.data.facilityId || 1;
    const amount = Number(rawVal.amount) || this.data.amount;

    this.stkSending.set(true);
    this.stkError.set(null);
    this.stkMessage.set('Sending M-Pesa STK Push prompt to phone...');

    this.billingService.initiateStkPush(facilityId, {
      invoiceId: this.data.invoiceId,
      phoneNumber: phone,
      amount: amount
    }).subscribe({
      next: (res) => {
        this.stkSending.set(false);
        if (res.success && res.data?.checkoutRequestId) {
          const reqId = res.data.checkoutRequestId;
          this.checkoutRequestId.set(reqId);
          this.stkPolling.set(true);
          this.stkMessage.set('STK Push sent to patient! Waiting for patient to enter PIN...');
          this.startStatusPolling(reqId);
        } else {
          this.stkError.set(res.message || 'Failed to trigger M-Pesa prompt.');
        }
      },
      error: (err) => {
        this.stkSending.set(false);
        console.error('STK Push error:', err);
        this.stkError.set(
          err?.error?.error || err?.error?.detail || 'Failed to connect to M-Pesa gateway.'
        );
      }
    });
  }

  startStatusPolling(checkoutReqId: string): void {
    this.stopPolling();
    let elapsedAttempts = 0;
    const maxAttempts = 20; // 20 * 3s = 60 seconds timeout

    this.pollTimer = setInterval(() => {
      elapsedAttempts++;
      if (elapsedAttempts > maxAttempts) {
        this.stopPolling();
        this.stkPolling.set(false);
        this.stkError.set('STK Push request timed out. Please retry or record payment manually.');
        return;
      }

      this.billingService.queryStkStatus(checkoutReqId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const status = res.data.status;
            if (status === 'Completed') {
              this.stopPolling();
              this.stkPolling.set(false);
              this.stkSuccess.set(true);
              this.stkMessage.set('Payment confirmed via M-Pesa! Closing dialog...');
              setTimeout(() => {
                const value = this.paymentForm.getRawValue();
                this.dialogRef.close({
                  amount: Number(value.amount),
                  method: 'Mobile Payment',
                });
              }, 1200);
            } else if (status === 'Failed' || status === 'Cancelled') {
              this.stopPolling();
              this.stkPolling.set(false);
              this.stkError.set(
                res.data.result_desc || `M-Pesa transaction ${status.toLowerCase()}.`
              );
            }
          }
        },
        error: (err) => {
          console.error('Polling error:', err);
        }
      });
    }, 3000);
  }

  onConfirmPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const value = this.paymentForm.getRawValue();

    this.dialogRef.close({
      amount: Number(value.amount),
      method: value.method ?? 'Cash',
    });
  }
}

