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

export interface EhrDialogPatient {
  id: string;
  name: string;
}

export interface EhrRecordDialogData {
  patients: EhrDialogPatient[];
}

export interface CreateEhrRecordPayload {
  patientId: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  doctorNotes: string;
}

@Component({
  selector: 'app-ehr-record-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './ehr-record-dialog.component.html',
  styleUrl: './ehr-record-dialog.component.css',
})
export class EhrRecordDialogComponent {
  readonly data = inject<EhrRecordDialogData>(MAT_DIALOG_DATA);

  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<EhrRecordDialogComponent, CreateEhrRecordPayload | undefined>,
  );

  readonly recordForm = this.formBuilder.group({
    patientId: ['', [Validators.required]],
    diagnosis: ['', [Validators.required]],
    symptoms: [''],
    treatment: [''],
    doctorNotes: [''],
  });

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const value = this.recordForm.getRawValue();

    this.dialogRef.close({
      patientId: value.patientId ?? '',
      diagnosis: value.diagnosis ?? '',
      symptoms: value.symptoms ?? '',
      treatment: value.treatment ?? '',
      doctorNotes: value.doctorNotes ?? '',
    });
  }
}
