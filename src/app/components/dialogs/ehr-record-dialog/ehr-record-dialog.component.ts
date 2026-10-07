import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ClinicalConcept, EhrLabResult, PatientVitals, Prescription } from '../../../models';
import { KnhtsConceptSearchComponent } from '../../shared/knhts-concept-search/knhts-concept-search.component';

export interface EhrDialogPatient {
  id: string;
  name: string;
}

export interface EhrRecordDialogData {
  patients: EhrDialogPatient[];
  patient?: EhrDialogPatient;
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
  vitals?: PatientVitals;
}

@Component({
  selector: 'app-ehr-record-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
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
    patientId: [this.data?.patient?.id || '', [Validators.required]],
    symptoms: [''],
    treatment: [''],
    doctorNotes: [''],
    vitals: this.formBuilder.group({
      systolicBp: [null],
      diastolicBp: [null],
      heartRateBpm: [null],
      temperatureC: [null],
      heightCm: [null],
      weightKg: [null],
    }),
  });

  selectedConcept: ClinicalConcept | null = null;

  get calculatedBmi(): string | null {
    const v = this.recordForm.get('vitals');
    const h = Number(v?.get('heightCm')?.value);
    const w = Number(v?.get('weightKg')?.value);
    if (h > 0 && w > 0) {
      return (w / ((h / 100) * (h / 100))).toFixed(1);
    }
    return null;
  }

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

    const rawVitals = value.vitals;
    const hasVitals = rawVitals && (rawVitals.systolicBp || rawVitals.diastolicBp || rawVitals.temperatureC || rawVitals.heartRateBpm || rawVitals.heightCm || rawVitals.weightKg);

    const vitalsPayload: PatientVitals | undefined = hasVitals ? {
      systolicBp: rawVitals.systolicBp ? Number(rawVitals.systolicBp) : undefined,
      diastolicBp: rawVitals.diastolicBp ? Number(rawVitals.diastolicBp) : undefined,
      heartRateBpm: rawVitals.heartRateBpm ? Number(rawVitals.heartRateBpm) : undefined,
      temperatureC: rawVitals.temperatureC ? Number(rawVitals.temperatureC) : undefined,
      heightCm: rawVitals.heightCm ? Number(rawVitals.heightCm) : undefined,
      weightKg: rawVitals.weightKg ? Number(rawVitals.weightKg) : undefined,
      bmi: this.calculatedBmi ? Number(this.calculatedBmi) : undefined,
    } : undefined;

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
      vitals: vitalsPayload,
    });
  }
}
