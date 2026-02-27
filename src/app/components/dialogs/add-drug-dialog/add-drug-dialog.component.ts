import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type AddDrugPayload = {
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  expiryDate: string;
  manufacturer: string;
};

type NewDrugForm = {
  name: string;
  category: string;
  stock: number | null;
  minStock: number | null;
  price: number | null;
  expiryDate: string;
  manufacturer: string;
};

@Component({
  selector: 'app-add-drug-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './add-drug-dialog.component.html',
  styleUrl: './add-drug-dialog.component.css',
})
export class AddDrugDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<AddDrugDialogComponent, AddDrugPayload | undefined>,
  );

  newDrug: NewDrugForm = this.createEmptyDrugForm();

  onCancel(): void {
    this.dialogRef.close();
  }

  onAddToCatalog(): void {
    if (!this.canSubmitDrug()) {
      return;
    }

    this.dialogRef.close({
      name: this.newDrug.name.trim(),
      category: this.newDrug.category.trim(),
      stock: Number(this.newDrug.stock),
      minStock: Number(this.newDrug.minStock),
      price: Number(this.newDrug.price),
      expiryDate: this.newDrug.expiryDate,
      manufacturer: this.newDrug.manufacturer.trim(),
    });
  }

  canSubmitDrug(): boolean {
    return Boolean(
      this.newDrug.name.trim() &&
      this.newDrug.category.trim() &&
      this.newDrug.manufacturer.trim() &&
      this.newDrug.expiryDate &&
      this.newDrug.stock !== null &&
      this.newDrug.minStock !== null &&
      this.newDrug.price !== null,
    );
  }

  private createEmptyDrugForm(): NewDrugForm {
    return {
      name: '',
      category: '',
      stock: null,
      minStock: null,
      price: null,
      expiryDate: '',
      manufacturer: '',
    };
  }
}
