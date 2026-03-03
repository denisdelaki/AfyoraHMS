import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  CreateLabOrderPayload,
  LabPriority,
  LabTest,
} from '../../../models/laboratory.models';

interface NewLabOrderDialogData {
  tests: LabTest[];
}

@Component({
  selector: 'app-new-lab-order-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './new-lab-order-dialog.component.html',
  styleUrl: './new-lab-order-dialog.component.css',
})
export class NewLabOrderDialogComponent {
  readonly data = inject<NewLabOrderDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<NewLabOrderDialogComponent, CreateLabOrderPayload | undefined>,
  );
  private readonly fb = inject(NonNullableFormBuilder);

  readonly priorities: LabPriority[] = ['Routine', 'Urgent', 'STAT'];

  readonly form = this.fb.group({
    patient: ['', [Validators.required, Validators.maxLength(100)]],
    patientId: ['', [Validators.required, Validators.maxLength(30)]],
    orderedBy: ['', [Validators.required, Validators.maxLength(100)]],
    testId: ['', Validators.required],
    priority: ['Routine' as LabPriority, Validators.required],
    notes: ['', Validators.maxLength(400)],
  });

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue() as CreateLabOrderPayload);
  }
}
