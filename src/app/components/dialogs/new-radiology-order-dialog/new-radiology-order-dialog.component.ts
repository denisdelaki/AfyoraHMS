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
import { MatSelectModule } from '@angular/material/select';
import {
  CreateImagingOrderPayload,
  ImagingPriority,
  ImagingType,
} from '../../../models/radiology.models';

interface NewRadiologyOrderDialogData {
  imagingTypes: ImagingType[];
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
  ],
  templateUrl: './new-radiology-order-dialog.component.html',
  styleUrl: './new-radiology-order-dialog.component.css',
})
export class NewRadiologyOrderDialogComponent {
  readonly data = inject<NewRadiologyOrderDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<
      NewRadiologyOrderDialogComponent,
      CreateImagingOrderPayload | undefined
    >,
  );
  private readonly fb = inject(NonNullableFormBuilder);

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

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue() as CreateImagingOrderPayload);
  }
}
