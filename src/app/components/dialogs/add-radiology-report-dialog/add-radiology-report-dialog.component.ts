import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
import {
  CreateRadiologyReportPayload,
  RadiologyOrder,
} from '../../../models/radiology.models';

interface AddRadiologyReportDialogData {
  order: RadiologyOrder;
}

@Component({
  selector: 'app-add-radiology-report-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './add-radiology-report-dialog.component.html',
  styleUrl: './add-radiology-report-dialog.component.css',
})
export class AddRadiologyReportDialogComponent {
  readonly data = inject<AddRadiologyReportDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<
      AddRadiologyReportDialogComponent,
      CreateRadiologyReportPayload | undefined
    >,
  );
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    radiologist: ['', [Validators.required, Validators.maxLength(120)]],
    findings: ['', [Validators.required, Validators.maxLength(4000)]],
    impression: ['', [Validators.required, Validators.maxLength(2000)]],
    recommendations: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      orderId: this.data.order.id,
      ...this.form.getRawValue(),
    } as CreateRadiologyReportPayload);
  }
}
