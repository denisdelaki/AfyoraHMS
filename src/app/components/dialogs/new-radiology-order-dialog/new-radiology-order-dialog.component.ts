import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  CreateImagingOrderPayload,
  ImagingPriority,
  ImagingType,
} from '../../../models/radiology.models';
import { MatDatepickerModule } from '@angular/material/datepicker';

interface NewRadiologyOrderDialogData {
  imagingTypes: ImagingType[];
  patients: { id: string; name: string }[];
  doctors: { id: string; name: string }[];
}

@Component({
  selector: 'app-new-radiology-order-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule
  ],
  templateUrl: './new-radiology-order-dialog.component.html',
  styleUrl: './new-radiology-order-dialog.component.css',
})
export class NewRadiologyOrderDialogComponent implements OnInit {
  readonly data = inject<NewRadiologyOrderDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<
      NewRadiologyOrderDialogComponent,
      CreateImagingOrderPayload | undefined
    >,
  );
  private readonly fb = inject(NonNullableFormBuilder);

  today: Date = new Date();

  patients: { id: string; name: string }[] = this.data.patients;
  doctors: { id: string; name: string }[] = this.data.doctors;

  readonly priorities: ImagingPriority[] = ['Routine', 'Urgent', 'STAT'];

  readonly form = this.fb.group({
    patient: ['', [Validators.required, Validators.maxLength(120)]],
    patientId: ['', [Validators.required, Validators.maxLength(30)]],
    orderedBy: ['', [Validators.required, Validators.maxLength(120)]],
    imagingTypeId: ['', Validators.required],
    scheduledDate: ['', Validators.required],
    priority: ['Routine' as ImagingPriority, Validators.required],
    clinicalNotes: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.form.controls.patient.valueChanges.subscribe((patientId) => {
      this.form.controls.patientId.setValue(patientId ?? '');
    });
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    this.dialogRef.close({
      ...rawValue,
      scheduledDate: this.formatDate(rawValue.scheduledDate),
    } as CreateImagingOrderPayload);
  }

  private formatDate(value: unknown): string {
    if (value instanceof Date && !isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return typeof value === 'string' ? value : '';
  }
}
