import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Vendor } from '../../../models/vendor.models';

@Component({
  selector: 'app-add-vendor-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './add-vendor-dialog.component.html',
  styleUrl: './add-vendor-dialog.component.css',
})
export class AddVendorDialogComponent {
  readonly form;
  isEdit = false;

  constructor(
    private fb: NonNullableFormBuilder,
    private dialogRef: MatDialogRef<AddVendorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { vendor?: Vendor }
  ) {
    this.isEdit = !!data?.vendor;
    this.form = this.fb.group({
      name: [data?.vendor?.name || '', [Validators.required, Validators.maxLength(255)]],
      contact: [data?.vendor?.contact || '', [Validators.required, Validators.maxLength(100)]],
      email: [data?.vendor?.email || '', [Validators.required, Validators.email]],
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }

  close() {
    this.dialogRef.close();
  }
}
