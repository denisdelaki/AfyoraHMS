import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
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
import { Vendor } from '../../../models/vendor.models';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

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
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './add-item-dialog.component.html',
  styleUrl: './add-item-dialog.component.css',
})
export class AddItemDialogComponent {
  readonly form;

  vendors: Vendor[] = [];

  isEdit = false;

  constructor(
    private fb: NonNullableFormBuilder,
    private dialogRef: MatDialogRef<AddItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { vendors: Vendor[], item?: any, type?: string }
  ) {
    this.isEdit = !!data?.item;
    this.vendors = data?.vendors || [];
    
    const defaultType = data?.type || data?.item?.type || 'Supply';

    this.form = this.fb.group({
      type: [{ value: defaultType, disabled: this.isEdit }, Validators.required],
      name: [data?.item?.name || '', [Validators.required, Validators.maxLength(100)]],
      category: [data?.item?.category || '', [Validators.required, Validators.maxLength(100)]],
      
      // Supply fields
      stock: [data?.item?.stock ?? 0, [Validators.min(0)]],
      minStock: [data?.item?.minStock ?? 0, [Validators.min(0)]],
      unit: [data?.item?.unit || '', [Validators.maxLength(30)]],
      price: [data?.item?.price ?? 0, [Validators.min(0)]],
      vendor: [data?.item?.vendor || ''],

      // Equipment fields
      status: [data?.item?.status || 'Operational'],
      location: [data?.item?.location || ''],
      lastMaintenance: [data?.item?.lastMaintenance || ''],
      nextMaintenance: [data?.item?.nextMaintenance || ''],
      purchaseDate: [data?.item?.purchaseDate || '']
    });
  }

  submit() {
    if (this.form.valid) {
      const payload = this.form.getRawValue();
      if (payload.lastMaintenance) {
        payload.lastMaintenance = new Date(payload.lastMaintenance).toISOString().split('T')[0];
      }
      if (payload.nextMaintenance) {
        payload.nextMaintenance = new Date(payload.nextMaintenance).toISOString().split('T')[0];
      }
      if (payload.purchaseDate) {
        payload.purchaseDate = new Date(payload.purchaseDate).toISOString().split('T')[0];
      }
      this.dialogRef.close(payload as AddInventoryItemPayload);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
