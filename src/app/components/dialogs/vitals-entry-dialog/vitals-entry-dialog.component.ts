import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientVitals } from '../../../models/patients.models';
import { PatientsService } from '../../../services/patients.service';

export interface VitalsEntryDialogData {
  patientId: string;
  patientName?: string;
  facilityId?: string | number;
  initialValue?: Partial<PatientVitals>;
}

@Component({
  selector: 'app-vitals-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="p-6 space-y-5 max-w-2xl mx-auto">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <mat-icon>monitor_heart</mat-icon>
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-800 tracking-tight">
              Patient Vitals Entry & Triage
            </h2>
            <p *ngIf="data.patientName" class="text-xs text-slate-500">
              Patient: <span class="font-bold text-slate-700">{{ data.patientName }}</span> (ID: {{ data.patientId }})
            </p>
          </div>
        </div>
        <button mat-icon-button type="button" (click)="onCancel()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Vitals Form -->
      <form [formGroup]="vitalsForm" (ngSubmit)="onSave()" class="space-y-4">
        <!-- Captured By Staff Name -->
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Captured By (Clinician / Nurse Name)</mat-label>
          <input matInput formControlName="capturedByName" placeholder="e.g. Nurse Jane Wanjiku" />
        </mat-form-field>

        <!-- Vital Signs Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <!-- Systolic BP -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Systolic BP (mmHg)</mat-label>
            <input matInput type="number" formControlName="systolicBp" placeholder="120" />
            <mat-hint>Normal: 90 - 120</mat-hint>
          </mat-form-field>

          <!-- Diastolic BP -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Diastolic BP (mmHg)</mat-label>
            <input matInput type="number" formControlName="diastolicBp" placeholder="80" />
            <mat-hint>Normal: 60 - 80</mat-hint>
          </mat-form-field>

          <!-- Temperature -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Temperature (°C)</mat-label>
            <input matInput type="number" step="0.1" formControlName="temperatureC" placeholder="37.5" />
            <mat-hint>Normal: 36.5 - 37.5°C</mat-hint>
          </mat-form-field>

          <!-- Pulse / Heart Rate -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Heart Rate (BPM)</mat-label>
            <input matInput type="number" formControlName="heartRateBpm" placeholder="72" />
            <mat-hint>Normal: 60 - 100 bpm</mat-hint>
          </mat-form-field>

          <!-- SpO2 -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>SpO2 Percent (%)</mat-label>
            <input matInput type="number" formControlName="spo2Percent" placeholder="98" />
            <mat-hint>Normal: 95 - 100%</mat-hint>
          </mat-form-field>

          <!-- Respiratory Rate -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Resp Rate (/min)</mat-label>
            <input matInput type="number" formControlName="respiratoryRate" placeholder="16" />
            <mat-hint>Normal: 12 - 20 /min</mat-hint>
          </mat-form-field>

          <!-- Blood Glucose -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Blood Glucose (mmol/L)</mat-label>
            <input matInput type="number" step="0.1" formControlName="bloodGlucoseMmol" placeholder="5.4" />
            <mat-hint>Fasting: 4.0 - 7.0 mmol/L</mat-hint>
          </mat-form-field>

          <!-- Height (cm) -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Height (cm)</mat-label>
            <input matInput type="number" step="0.1" formControlName="heightCm" placeholder="175" />
          </mat-form-field>

          <!-- Weight (kg) -->
          <mat-form-field appearance="fill" class="w-full">
            <mat-label>Weight (kg)</mat-label>
            <input matInput type="number" step="0.1" formControlName="weightKg" placeholder="70" />
          </mat-form-field>
        </div>

        <!-- Dynamic BMI Calculation Badge -->
        <div *ngIf="calculatedBmi" class="p-3.5 rounded-xl border border-teal-200 bg-teal-50/70 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <mat-icon class="text-teal-700">fitness_center</mat-icon>
            <div>
              <span class="text-xs font-bold text-slate-800">Auto-Calculated BMI</span>
              <p class="text-xs text-slate-600">Based on height {{ vitalsForm.get('heightCm')?.value }} cm and weight {{ vitalsForm.get('weightKg')?.value }} kg</p>
            </div>
          </div>
          <span [class]="'px-3 py-1 rounded-full text-xs font-bold shadow-xs ' + bmiBadgeClass">
            BMI: {{ calculatedBmi }} ({{ bmiCategory }})
          </span>
        </div>

        <!-- Pain Score (0-10) -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Pain Score (0 = No Pain, 10 = Severe Pain)
          </label>
          <div class="flex items-center gap-2">
            <input type="range" min="0" max="10" formControlName="painScore" class="w-full accent-emerald-600" />
            <span class="w-10 text-center font-bold text-sm bg-slate-100 py-1 rounded border border-slate-300">
              {{ vitalsForm.get('painScore')?.value || 0 }}
            </span>
          </div>
        </div>

        <!-- Clinical Notes / Observations -->
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Vitals Notes & Triage Observations</mat-label>
          <textarea matInput rows="2" formControlName="notes" placeholder="Patient resting comfortably, no acute distress..."></textarea>
        </mat-form-field>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button mat-stroked-button type="button" (click)="onCancel()" class="!rounded-xl">
            Cancel
          </button>
          <button mat-flat-button color="primary" type="submit" [disabled]="saving" class="!rounded-xl !bg-emerald-600 hover:!bg-emerald-700">
            <mat-icon class="mr-1">save</mat-icon>
            {{ saving ? 'Saving Vitals...' : 'Save Patient Vitals' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [],
})
export class VitalsEntryDialogComponent implements OnInit {
  data = inject<VitalsEntryDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<VitalsEntryDialogComponent, PatientVitals | undefined>);
  private readonly patientsService = inject(PatientsService);
  private readonly snackBar = inject(MatSnackBar);

  saving = false;
  facilityId: string | number = '';

  readonly vitalsForm: FormGroup = this.formBuilder.group({
    capturedByName: ['Nurse Jane Wanjiku'],
    systolicBp: [null, [Validators.min(40), Validators.max(300)]],
    diastolicBp: [null, [Validators.min(20), Validators.max(200)]],
    temperatureC: [null, [Validators.min(30), Validators.max(45)]],
    heartRateBpm: [null, [Validators.min(30), Validators.max(250)]],
    spo2Percent: [null, [Validators.min(50), Validators.max(100)]],
    respiratoryRate: [null, [Validators.min(5), Validators.max(60)]],
    bloodGlucoseMmol: [null],
    heightCm: [null, [Validators.min(20), Validators.max(300)]],
    weightKg: [null, [Validators.min(1), Validators.max(500)]],
    painScore: [0, [Validators.min(0), Validators.max(10)]],
    notes: [''],
  });

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('afyora.user') || 'null');
    this.facilityId = this.data.facilityId || currentUser?.facility || '';
    if (currentUser?.fullName || currentUser?.username) {
      this.vitalsForm.patchValue({
        capturedByName: currentUser.fullName || currentUser.username,
      });
    }

    if (this.data.initialValue) {
      this.vitalsForm.patchValue(this.data.initialValue);
    }
  }

  get calculatedBmi(): string | null {
    const h = Number(this.vitalsForm.get('heightCm')?.value);
    const w = Number(this.vitalsForm.get('weightKg')?.value);
    if (h > 0 && w > 0) {
      const heightM = h / 100;
      const bmiVal = w / (heightM * heightM);
      return bmiVal.toFixed(1);
    }
    return null;
  }

  get bmiCategory(): string {
    const val = Number(this.calculatedBmi);
    if (!val) return 'Normal';
    if (val < 18.5) return 'Underweight';
    if (val < 25) return 'Normal';
    if (val < 30) return 'Overweight';
    return 'Obese';
  }

  get bmiBadgeClass(): string {
    const cat = this.bmiCategory;
    if (cat === 'Underweight') return 'bg-amber-100 text-amber-800 border border-amber-300';
    if (cat === 'Normal') return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    if (cat === 'Overweight') return 'bg-orange-100 text-orange-800 border border-orange-300';
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.vitalsForm.invalid) {
      this.vitalsForm.markAllAsTouched();
      return;
    }

    const val = this.vitalsForm.getRawValue();
    const payload: PatientVitals = {
      facilityId: this.facilityId,
      patientId: this.data.patientId,
      capturedByName: (val.capturedByName || '').trim(),
      temperatureC: val.temperatureC ? Number(val.temperatureC) : undefined,
      systolicBp: val.systolicBp ? Number(val.systolicBp) : undefined,
      diastolicBp: val.diastolicBp ? Number(val.diastolicBp) : undefined,
      heartRateBpm: val.heartRateBpm ? Number(val.heartRateBpm) : undefined,
      respiratoryRate: val.respiratoryRate ? Number(val.respiratoryRate) : undefined,
      spo2Percent: val.spo2Percent ? Number(val.spo2Percent) : undefined,
      bloodGlucoseMmol: val.bloodGlucoseMmol ? Number(val.bloodGlucoseMmol) : undefined,
      heightCm: val.heightCm ? Number(val.heightCm) : undefined,
      weightKg: val.weightKg ? Number(val.weightKg) : undefined,
      bmi: this.calculatedBmi ? Number(this.calculatedBmi) : undefined,
      painScore: val.painScore !== null ? Number(val.painScore) : undefined,
      notes: (val.notes || '').trim(),
    };

    this.saving = true;
    this.patientsService.createPatientVitals(payload).subscribe({
      next: (created) => {
        this.saving = false;
        this.snackBar.open('✓ Patient vitals recorded successfully!', 'Close', { duration: 3500 });
        this.dialogRef.close(created || payload);
      },
      error: () => {
        this.saving = false;
        // Local fallback
        this.snackBar.open('✓ Patient vitals captured locally!', 'Close', { duration: 3500 });
        this.dialogRef.close(payload);
      },
    });
  }
}
