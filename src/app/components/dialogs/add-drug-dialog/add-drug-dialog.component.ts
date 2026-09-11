import { formatDate } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DrugCategory } from '../../../models';

export type AddDrugPayload = {
  name: string;
  categoryId: number;
  stock: number;
  minStock: number;
  price: number;
  expiryDate: string;
  manufacturer: string;
};

@Component({
  selector: 'app-add-drug-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  templateUrl: './add-drug-dialog.component.html',
  styleUrl: './add-drug-dialog.component.css',
})
export class AddDrugDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<AddDrugDialogComponent, AddDrugPayload | undefined>,
  );
  private readonly fb = inject(FormBuilder);
  readonly data = inject(MAT_DIALOG_DATA);

  readonly today = new Date();
  readonly drugCategories: DrugCategory[] = this.data?.categories || [];

  readonly drugForm = this.fb.group({
    name: ['', [Validators.required]],
    categoryId: [null as number | null, [Validators.required]],
    stock: [null as number | null, [Validators.required, Validators.min(0)]],
    minStock: [null as number | null, [Validators.required, Validators.min(0)]],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    expiryDate: ['', [Validators.required]],
    manufacturer: ['', [Validators.required]],
  });

  onCancel(): void {
    this.dialogRef.close();
  }

  onAddToCatalog(): void {
    if (this.drugForm.invalid) {
      this.drugForm.markAllAsTouched();
      return;
    }

    const v = this.drugForm.getRawValue();
    this.dialogRef.close({
      name: v.name!.trim(),
      categoryId: Number(v.categoryId),
      stock: Number(v.stock),
      minStock: Number(v.minStock),
      price: Number(v.price),
      expiryDate: formatDate(v.expiryDate!, 'yyyy-MM-dd', 'en-US'),
      manufacturer: v.manufacturer!.trim(),
    });
  }
}
