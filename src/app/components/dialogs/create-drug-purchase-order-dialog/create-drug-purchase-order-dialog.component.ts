import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Drug, CreateDrugPurchaseOrderRequest } from '../../../models';
import { Vendor } from '../../../models/vendor.models';

export interface CreateDrugPurchaseOrderDialogData {
  facilityId: string | number;
  vendors: Vendor[];
  drugs: Drug[];
  defaultDrug?: Drug;
}

@Component({
  selector: 'app-create-drug-purchase-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './create-drug-purchase-order-dialog.component.html',
  styleUrl: './create-drug-purchase-order-dialog.component.css',
})
export class CreateDrugPurchaseOrderDialogComponent implements OnInit {
  form: FormGroup;

  vendors: Vendor[] = [];
  drugs: Drug[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateDrugPurchaseOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateDrugPurchaseOrderDialogData,
  ) {
    this.vendors = data?.vendors || [];
    this.drugs = data?.drugs || [];

    this.form = this.fb.group({
      vendorId: [null, [Validators.required]],
      status: ['Pending', [Validators.required]],
      expectedDate: [''],
      notes: [''],
      items: this.fb.array([], [Validators.required]),
    });
  }

  ngOnInit(): void {
    if (this.data?.defaultDrug) {
      const d = this.data.defaultDrug;
      const defaultQty = Math.max((d.minStock || 0) - (d.stock || 0) + 10, 10);
      this.addItem(d.name, defaultQty, d.price || 0);
    } else {
      this.addItem();
    }
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItemGroup(drugName = '', quantity = 1, unitPrice = 0): FormGroup {
    return this.fb.group({
      drugName: [drugName, [Validators.required, Validators.maxLength(255)]],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
      unitPrice: [unitPrice, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(drugName = '', quantity = 1, unitPrice = 0): void {
    this.items.push(this.createItemGroup(drugName, quantity, unitPrice));
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  onDrugSelect(index: number, drugName: string): void {
    const selectedDrug = this.drugs.find((d) => d.name === drugName);
    if (selectedDrug) {
      const itemGroup = this.items.at(index) as FormGroup;
      itemGroup.patchValue({
        drugName: selectedDrug.name,
        unitPrice: selectedDrug.price || 0,
      });
    }
  }

  getItemTotal(index: number): number {
    const item = this.items.at(index).value;
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return qty * price;
  }

  get grandTotal(): number {
    return this.items.controls.reduce((acc, _, idx) => acc + this.getItemTotal(idx), 0);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.value;

    let formattedExpectedDate: string | undefined = undefined;
    if (rawValue.expectedDate) {
      const dateObj = new Date(rawValue.expectedDate);
      if (!isNaN(dateObj.getTime())) {
        formattedExpectedDate = dateObj.toISOString().split('T')[0];
      }
    }

    const payload: CreateDrugPurchaseOrderRequest = {
      vendorId: rawValue.vendorId ? Number(rawValue.vendorId) : undefined,
      status: rawValue.status,
      expectedDate: formattedExpectedDate,
      notes: rawValue.notes,
      items: rawValue.items.map((item: any) => ({
        drugName: item.drugName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };

    this.dialogRef.close(payload);
  }

  close(): void {
    this.dialogRef.close();
  }
}
