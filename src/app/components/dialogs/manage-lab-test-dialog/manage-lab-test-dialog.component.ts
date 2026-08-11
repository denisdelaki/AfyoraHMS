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
import { MatInputModule } from '@angular/material/input';
import { LabTest, LabTestPayload } from '../../../models';

type ManageLabTestDialogData = {
  mode: 'create' | 'edit';
  test?: LabTest;
};

@Component({
  selector: 'app-manage-lab-test-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './manage-lab-test-dialog.component.html',
  styleUrl: './manage-lab-test-dialog.component.css',
})
export class ManageLabTestDialogComponent {
  readonly form;

  constructor(
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly dialogRef: MatDialogRef<
      ManageLabTestDialogComponent,
      LabTestPayload
    >,
    @Inject(MAT_DIALOG_DATA) readonly data: ManageLabTestDialogData,
  ) {
    const test = data.test;
    this.form = this.formBuilder.group({
      id: [test?.id ?? '', [Validators.required, Validators.maxLength(30)]],
      name: [
        test?.name ?? '',
        [Validators.required, Validators.maxLength(120)],
      ],
      category: [
        test?.category ?? '',
        [Validators.required, Validators.maxLength(80)],
      ],
      duration: [
        test?.duration ?? '',
        [Validators.required, Validators.maxLength(40)],
      ],
      price: [test?.price ?? 0, [Validators.required, Validators.min(0)]],
    });

    if (this.isEditMode) {
      this.form.controls.id.disable();
    }
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
      id: raw.id.trim(),
      name: raw.name.trim(),
      category: raw.category.trim(),
      duration: raw.duration.trim(),
      price: Number(raw.price),
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
