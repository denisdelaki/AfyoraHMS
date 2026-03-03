import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AddInventoryItemPayload } from '../../../models/inventory.models';

@Component({
  selector: 'app-add-item-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
  ],
  templateUrl: './add-item-dialog.component.html',
  styleUrl: './add-item-dialog.component.css',
})
export class AddItemDialogComponent {
  readonly form;

  constructor(
    private fb: NonNullableFormBuilder,
    private dialogRef: MatDialogRef<AddItemDialogComponent>,
  ) {
    this.form = this.fb.group({
      type: ['Supply', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      category: ['', [Validators.required, Validators.maxLength(100)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
      unit: ['', [Validators.required, Validators.maxLength(30)]],
      price: [0, [Validators.required, Validators.min(0)]],
      vendor: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue() as AddInventoryItemPayload);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
