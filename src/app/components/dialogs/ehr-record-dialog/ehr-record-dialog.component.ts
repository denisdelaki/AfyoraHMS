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
import { ClinicalConcept, EhrLabResult, Prescription } from '../../../models';
import { KnhtsConceptSearchComponent } from '../../shared/knhts-concept-search/knhts-concept-search.component';

export interface EhrDialogPatient {
  id: string;
  name: string;
}

export interface EhrRecordDialogData {
  patients: EhrDialogPatient[];
}

export interface CreateEhrRecordPayload {
  id: string;
  patientId: string;
  diagnosis: string;
  diagnosisCode?: string;
  diagnosisSystem?: string;
  diagnosisText?: string;
  symptoms: string;
  treatment: string;
  doctorNotes: string;
  prescriptions: Prescription[];
  labResults: EhrLabResult[];
  notes: string;
  clinicalConcept?: ClinicalConcept;
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
    KnhtsConceptSearchComponent,
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
    symptoms: [''],
    treatment: [''],
    doctorNotes: [''],
  });

  selectedConcept: ClinicalConcept | null = null;

  onConceptSelected(concept: ClinicalConcept | null): void {
    this.selectedConcept = concept;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.recordForm.invalid || !this.selectedConcept) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const value = this.recordForm.getRawValue();

    const diagnosisCode = this.selectedConcept.coding?.[0]?.code || this.selectedConcept.code || '';
    const diagnosisSystem = this.selectedConcept.coding?.[0]?.system || this.selectedConcept.system || 'KNHTS';
    const diagnosisText = this.selectedConcept.display || this.selectedConcept.text || '';

    this.dialogRef.close({
      id: '',
      prescriptions: [],
      labResults: [],
      notes: '',
      patientId: value.patientId ?? '',
      diagnosis: diagnosisText,
      diagnosisCode,
      diagnosisSystem,
      diagnosisText,
      symptoms: value.symptoms ?? '',
      treatment: value.treatment ?? '',
      doctorNotes: value.doctorNotes ?? '',
      clinicalConcept: this.selectedConcept,
    });
  }
}
