import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RecordPaymentPayload } from '../../../models/billing.models';

export type RecordPaymentDialogData = {
  invoiceId: string;
  amount: number;
};

@Component({
  selector: 'app-record-payment-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './record-payment-dialog.component.html',
  styleUrl: './record-payment-dialog.component.css',
})
export class RecordPaymentDialogComponent {
  readonly data = inject<RecordPaymentDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<
      RecordPaymentDialogComponent,
      RecordPaymentPayload | undefined
    >,
  );

  readonly paymentMethods = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'Mobile Payment',
    'Insurance',
  ];

  readonly paymentForm = this.formBuilder.group({
    amount: [this.data.amount, [Validators.required, Validators.min(0)]],
    method: ['Cash', [Validators.required]],
  });

  onCancel(): void {
    this.dialogRef.close();
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
