import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
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
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  CreateImagingTypePayload,
  ImagingType,
} from '../../../models/radiology.models';

export type ManageImagingTypeDialogData = {
  mode: 'create' | 'edit';
  type?: ImagingType;
};

@Component({
  selector: 'app-manage-imaging-type-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './manage-imaging-type-dialog.component.html',
  styleUrl: './manage-imaging-type-dialog.component.css',
})
export class ManageImagingTypeDialogComponent {
  readonly form;

  readonly modalities = [
    'X-Ray',
    'CT Scan',
    'MRI',
    'Ultrasound',
    'PET Scan',
    'Mammography',
    'Fluoroscopy',
    'Nuclear Medicine',
    'DEXA Scan',
    'Angiography',
    'Other',
  ];

  constructor(
    private readonly fb: NonNullableFormBuilder,
    private readonly dialogRef: MatDialogRef<
      ManageImagingTypeDialogComponent,
      CreateImagingTypePayload
    >,
    @Inject(MAT_DIALOG_DATA) readonly data: ManageImagingTypeDialogData,
  ) {
    const t = data.type;
    this.form = this.fb.group({
      name: [t?.name ?? '', [Validators.required, Validators.maxLength(120)]],
      modality: [
        t?.modality ?? '',
        [Validators.required],
      ],
      bodyPart: [
        t?.bodyPart ?? '',
        [Validators.required, Validators.maxLength(80)],
      ],
      duration: [
        t?.duration ?? '',
        [Validators.required, Validators.maxLength(40)],
      ],
      price: [t?.price ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      name: raw.name.trim(),
      modality: raw.modality.trim(),
      bodyPart: raw.bodyPart.trim(),
      duration: raw.duration.trim(),
      price: Number(raw.price),
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
