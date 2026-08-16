import { Component, inject, OnInit } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientsService, BillingService } from '../../../services';
import { Patient } from '../../../models';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, Pill, RefreshCw, Plus, Trash2, Activity, FileText } from 'lucide-angular';

@Component({
  selector: 'app-new-invoice-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
  ],
  templateUrl: './new-invoice-dialog.component.html',
  styleUrl: './new-invoice-dialog.component.css',
})
export class NewInvoiceDialogComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly patientService = inject(PatientsService);
  private readonly billingService = inject(BillingService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<NewInvoiceDialogComponent, NewInvoicePayload | undefined>,
  );

  readonly Pill = Pill;
  readonly RefreshCw = RefreshCw;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly Activity = Activity;
  readonly FileText = FileText;

  patients: Patient[] = [];
  facilityId: string | number = '';

  // Pharmacy charges state
  isLoadingPharmacyCharges = false;
  pharmacyTotal = 0;
  pharmacyItemCount = 0;
  pharmacyMessage = '';

  // Lab charges state
  isLoadingLabCharges = false;
  labTotal = 0;
  labItemCount = 0;
  labMessage = '';

  // Radiology charges state
  isLoadingRadiologyCharges = false;
  radiologyTotal = 0;
  radiologyItemCount = 0;
  radiologyMessage = '';

  readonly invoiceForm = this.formBuilder.group({
    patientId: ['', [Validators.required]],
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

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.loadPatients(this.facilityId);

    // Watch patient selection changes to automatically fetch all outstanding charges
    this.invoiceForm.controls.patientId.valueChanges.subscribe((patientId) => {
      if (patientId) {
        this.fetchOutstandingCharges(patientId);
      }
    });
  }

  private loadPatients(facilityId: string | number): void {
    this.patientService.getPatients(facilityId).subscribe({
      next: (patients) => {
        this.patients = patients;
        console.log('Patients loaded:', patients);
      },
      error: () => {
        this.snackBar.open(
          'Failed to load patients. Please try again later.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );
      },
    });
  }

  fetchOutstandingCharges(patientId?: string | null): void {
    const selectedId = patientId || this.invoiceForm.controls.patientId.value;
    if (!selectedId) {
      return;
    }

    // Reset default empty row if no items filled
    if (
      this.services.length === 1 &&
      !this.services.at(0).get('service')?.value
    ) {
      this.services.clear();
    }

    this.fetchPharmacyCharges(selectedId);
    this.fetchLabCharges(selectedId);
    this.fetchRadiologyCharges(selectedId);
  }

  fetchPharmacyCharges(patientId: string): void {
    this.isLoadingPharmacyCharges = true;
    this.pharmacyMessage = '';

    this.billingService
      .getPatientPharmacyCharges(patientId, this.facilityId)
      .subscribe({
        next: (res) => {
          this.isLoadingPharmacyCharges = false;
          if (
            res.success &&
            res.data &&
            res.data.items &&
            res.data.items.length > 0
          ) {
            let addedCount = 0;
            for (const item of res.data.items) {
              const exists = this.services.controls.some(
                (ctrl) => ctrl.get('service')?.value === item.service,
              );
              if (!exists) {
                this.services.push(
                  this.formBuilder.group({
                    service: [item.service, [Validators.required]],
                    amount: [
                      item.amount,
                      [Validators.required, Validators.min(0)],
                    ],
                  }),
                );
                addedCount++;
              }
            }

            this.pharmacyTotal = res.data.totalAmount;
            this.pharmacyItemCount = res.data.items.length;
            this.pharmacyMessage = `Fetched ${res.data.items.length} pharmacy charge(s) ($${res.data.totalAmount.toFixed(2)}).`;
          } else {
            this.pharmacyTotal = 0;
            this.pharmacyItemCount = 0;
            this.pharmacyMessage = 'No pharmacy charges found for this customer.';
          }
        },
        error: (err) => {
          this.isLoadingPharmacyCharges = false;
          console.error('Failed to fetch pharmacy charges:', err);
          this.pharmacyMessage = 'Failed to load pharmacy charges.';
        },
      });
  }

  fetchLabCharges(patientId: string): void {
    this.isLoadingLabCharges = true;
    this.labMessage = '';

    this.billingService
      .getPatientLabCharges(patientId, this.facilityId)
      .subscribe({
        next: (res) => {
          this.isLoadingLabCharges = false;
          if (
            res.success &&
            res.data &&
            res.data.items &&
            res.data.items.length > 0
          ) {
            let addedCount = 0;
            for (const item of res.data.items) {
              const exists = this.services.controls.some(
                (ctrl) => ctrl.get('service')?.value === item.service,
              );
              if (!exists) {
                this.services.push(
                  this.formBuilder.group({
                    service: [item.service, [Validators.required]],
                    amount: [
                      item.amount,
                      [Validators.required, Validators.min(0)],
                    ],
                  }),
                );
                addedCount++;
              }
            }

            this.labTotal = res.data.totalAmount;
            this.labItemCount = res.data.items.length;
            this.labMessage = `Fetched ${res.data.items.length} lab charge(s) ($${res.data.totalAmount.toFixed(2)}).`;
          } else {
            this.labTotal = 0;
            this.labItemCount = 0;
            this.labMessage = 'No lab charges found for this customer.';
          }
        },
        error: (err) => {
          this.isLoadingLabCharges = false;
          console.error('Failed to fetch lab charges:', err);
          this.labMessage = 'Failed to load lab charges.';
        },
      });
  }

  fetchRadiologyCharges(patientId: string): void {
    this.isLoadingRadiologyCharges = true;
    this.radiologyMessage = '';

    this.billingService
      .getPatientRadiologyCharges(patientId, this.facilityId)
      .subscribe({
        next: (res) => {
          this.isLoadingRadiologyCharges = false;
          if (
            res.success &&
            res.data &&
            res.data.items &&
            res.data.items.length > 0
          ) {
            let addedCount = 0;
            for (const item of res.data.items) {
              const exists = this.services.controls.some(
                (ctrl) => ctrl.get('service')?.value === item.service,
              );
              if (!exists) {
                this.services.push(
                  this.formBuilder.group({
                    service: [item.service, [Validators.required]],
                    amount: [
                      item.amount,
                      [Validators.required, Validators.min(0)],
                    ],
                  }),
                );
                addedCount++;
              }
            }

            this.radiologyTotal = res.data.totalAmount;
            this.radiologyItemCount = res.data.items.length;
            this.radiologyMessage = `Fetched ${res.data.items.length} radiology charge(s) ($${res.data.totalAmount.toFixed(2)}).`;
          } else {
            this.radiologyTotal = 0;
            this.radiologyItemCount = 0;
            this.radiologyMessage = 'No radiology charges found for this customer.';
          }
        },
        error: (err) => {
          this.isLoadingRadiologyCharges = false;
          console.error('Failed to fetch radiology charges:', err);
          this.radiologyMessage = 'Failed to load radiology charges.';
        },
      });
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
    console.log('Invoice form submitted:', this.invoiceForm.value);
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    const value = this.invoiceForm.getRawValue();
    const company = (value.insuranceCompany ?? '').trim();
    const selectedPatient = this.patients.find(
      (p) => String(p.id) === String(value.patientId),
    );
    const patientName = selectedPatient
      ? `${selectedPatient.firstName} ${selectedPatient.lastName}`.trim()
      : value.patientId ?? '';

    console.log('Invoice form value:', value);
    this.dialogRef.close({
      patient: patientName,
      patientId: (value.patientId ?? '').trim(),
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


