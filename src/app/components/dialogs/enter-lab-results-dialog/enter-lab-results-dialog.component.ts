import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  FormArray,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  LabRequest,
  SubmitLabResultPayload,
} from '../../../models/laboratory.models';

interface EnterLabResultsDialogData {
  request: LabRequest;
}

@Component({
  selector: 'app-enter-lab-results-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './enter-lab-results-dialog.component.html',
  styleUrl: './enter-lab-results-dialog.component.css',
})
export class EnterLabResultsDialogComponent {
  readonly data = inject<EnterLabResultsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<
      EnterLabResultsDialogComponent,
      SubmitLabResultPayload | undefined
    >,
  );
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    parameters: this.fb.array([this.createParameterGroup()]),
    remarks: ['', Validators.maxLength(400)],
  });

  get parameters() {
    return this.form.controls.parameters as FormArray;
  }

  addParameter() {
    this.parameters.push(this.createParameterGroup());
  }

  removeParameter(index: number) {
    if (this.parameters.length === 1) {
      return;
    }

    this.parameters.removeAt(index);
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      labId: this.data.request.id,
      parameters: this.form.getRawValue().parameters,
      remarks: this.form.getRawValue().remarks,
    });
  }

  private createParameterGroup() {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(60)]],
      value: ['', [Validators.required, Validators.maxLength(30)]],
      unit: ['', [Validators.required, Validators.maxLength(20)]],
      range: ['', [Validators.required, Validators.maxLength(40)]],
      status: ['Normal' as 'Normal' | 'Abnormal', Validators.required],
    });
  }
}
