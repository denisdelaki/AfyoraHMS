import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormArray,
  FormGroup,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type PrescriptionDrug = {
  name: string;
  quantity: number;
  dosage: string;
};

export type PrescriptionEntry = {
  drugs: PrescriptionDrug[];
  status: 'Pending' | 'Dispensed';
  date: string;
};

export type VisitRecordFormValue = {
  date: string;
  doctor: string;
  diagnosis: string;
  prescriptions: PrescriptionEntry[];
  amountBilled: string;
  whatHappened: string;
};

export type DoctorOption = {
  id: string;
  name: string;
};

type AddVisitRecordDialogData = {
  mode: 'create' | 'edit';
  doctors: DoctorOption[];
  initialValue?: VisitRecordFormValue;
};

@Component({
  selector: 'app-add-visit-record-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './add-visit-record-dialog.component.html',
  styleUrl: './add-visit-record-dialog.component.css',
})
export class AddVisitRecordDialogComponent {
  readonly data = inject<AddVisitRecordDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<
      AddVisitRecordDialogComponent,
      VisitRecordFormValue | undefined
    >,
  );

  readonly visitForm = this.formBuilder.group({
    date: [
      this.data.initialValue?.date ?? this.todayDateValue(),
      [Validators.required],
    ],
    doctor: [this.data.initialValue?.doctor ?? '', [Validators.required]],
    diagnosis: [this.data.initialValue?.diagnosis ?? '', [Validators.required]],
    prescriptions: this.formBuilder.array(
      (this.data.initialValue?.prescriptions ?? []).map((p) =>
        this.buildPrescriptionGroup(p),
      ),
    ),
    amountBilled: [
      this.data.initialValue?.amountBilled ?? '0.00',
      [Validators.required],
    ],
    whatHappened: [
      this.data.initialValue?.whatHappened ?? '',
      [Validators.required],
    ],
  });

  get title(): string {
    return this.data.mode === 'edit' ? 'Edit Visit Record' : 'Add Visit Record';
  }

  get submitLabel(): string {
    return this.data.mode === 'edit' ? 'Update Record' : 'Save Record';
  }

  get prescriptions(): FormArray {
    return this.visitForm.get('prescriptions') as FormArray;
  }

  drugsArray(prescriptionIndex: number): FormArray {
    return this.prescriptions.at(prescriptionIndex).get('drugs') as FormArray;
  }

  addPrescription(): void {
    this.prescriptions.push(this.buildPrescriptionGroup());
  }

  removePrescription(index: number): void {
    this.prescriptions.removeAt(index);
  }

  addDrug(prescriptionIndex: number): void {
    this.drugsArray(prescriptionIndex).push(this.buildDrugGroup());
  }

  removeDrug(prescriptionIndex: number, drugIndex: number): void {
    this.drugsArray(prescriptionIndex).removeAt(drugIndex);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.visitForm.invalid) {
      this.visitForm.markAllAsTouched();
      return;
    }

    const value = this.visitForm.getRawValue();
    this.dialogRef.close({
      date: value.date ?? this.todayDateValue(),
      doctor: (value.doctor ?? '').trim(),
      diagnosis: (value.diagnosis ?? '').trim(),
      prescriptions: (value.prescriptions ?? []).map((p) => ({
        drugs: (
          (p['drugs'] as {
            name: string;
            quantity: number;
            dosage: string;
          }[]) ?? []
        ).map((d) => ({
          name: ((d['name'] as string) ?? '').trim(),
          quantity: Number((d['quantity'] as number) ?? 1),
          dosage: ((d['dosage'] as string) ?? '').trim(),
        })),
        status: p['status'] as 'Pending' | 'Dispensed',
        date: (p['date'] as string) ?? this.todayDateValue(),
      })),
      amountBilled: String(value.amountBilled ?? '0.00').trim(),
      whatHappened: (value.whatHappened ?? '').trim(),
    });
  }

  private buildPrescriptionGroup(
    initial?: Partial<PrescriptionEntry>,
  ): FormGroup {
    return this.formBuilder.group({
      date: [initial?.date ?? this.todayDateValue(), [Validators.required]],
      status: [initial?.status ?? 'Pending', [Validators.required]],
      drugs: this.formBuilder.array(
        (initial?.drugs ?? [{ name: '', quantity: 1, dosage: '' }]).map((d) =>
          this.buildDrugGroup(d),
        ),
      ),
    });
  }

  private buildDrugGroup(initial?: Partial<PrescriptionDrug>): FormGroup {
    return this.formBuilder.group({
      name: [initial?.name ?? '', [Validators.required]],
      quantity: [
        initial?.quantity ?? 1,
        [Validators.required, Validators.min(1)],
      ],
      dosage: [initial?.dosage ?? '', [Validators.required]],
    });
  }

  private todayDateValue(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
