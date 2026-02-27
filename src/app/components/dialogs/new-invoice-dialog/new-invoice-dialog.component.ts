import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NewInvoicePayload } from '../../../models/billing.models';

@Component({
  selector: 'app-new-invoice-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './new-invoice-dialog.component.html',
  styleUrl: './new-invoice-dialog.component.css',
})
export class NewInvoiceDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<NewInvoiceDialogComponent, NewInvoicePayload | undefined>,
  );

  readonly invoiceForm = this.formBuilder.group({
    patient: ['', [Validators.required]],
    services: this.formBuilder.array([
      this.formBuilder.group({
        service: ['', [Validators.required]],
        amount: [
          null as number | null,
          [Validators.required, Validators.min(0)],
        ],
      }),
    ]),
    insuranceCompany: [''],
    coverage: [null as number | null],
  });

  get services(): FormArray {
    return this.invoiceForm.controls.services;
  }

  addService(): void {
    this.services.push(
      this.formBuilder.group({
        service: ['', [Validators.required]],
        amount: [
          null as number | null,
          [Validators.required, Validators.min(0)],
        ],
      }),
    );
  }

  removeService(index: number): void {
    if (this.services.length <= 1) {
      return;
    }

    this.services.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onGenerateInvoice(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    const value = this.invoiceForm.getRawValue();
    const company = (value.insuranceCompany ?? '').trim();

    this.dialogRef.close({
      patient: (value.patient ?? '').trim(),
      items: (value.services ?? [])
        .filter((item) => item.service && item.amount !== null)
        .map((item) => ({
          service: item.service!.trim(),
          amount: Number(item.amount),
        })),
      insurance: company
        ? {
            company,
            coverage: value.coverage !== null ? Number(value.coverage) : null,
          }
        : null,
    });
  }
}
